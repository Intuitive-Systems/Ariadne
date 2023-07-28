import { openaiCompletion } from "./openai";
import retry from 'async-retry';
import {traceFunction} from "../trace";
import { numTokens } from "../tokenization/tokenizer";
import { outdent } from "outdent";

type AtLeastOne<T> = [T, ...T[]];

export enum LabelType {
    CATEGORY = "category",
    SELECT_CATEGORY = "select-category",
    BINARY_CLASSIFY = "binary-classify",
}

export interface LabelResult {
    label: string;
    confidence: number;
    type?: string;
}

export interface BaseLabel {
    name: string;
    description: string;
}

export interface HierarchicalLabel<T extends LabelType = LabelType> extends BaseLabel {
    type: T;
    children?: LabelOfType[];
}

export interface BinaryClassifyLabel extends HierarchicalLabel<LabelType.BINARY_CLASSIFY> {
}

export interface CategoryLabel extends HierarchicalLabel<LabelType.CATEGORY> {
}

export interface SelectCategoryLabel extends HierarchicalLabel<LabelType.SELECT_CATEGORY> {
    children: AtLeastOne<CategoryLabel>;
}

type LabelOfType = BinaryClassifyLabel | CategoryLabel | SelectCategoryLabel;


const individualExamples = [
    outdent`
    Document:
    ------
    Dear Myriad Delivery Services Claims Department,

    I am writing to file a claim against your company for damages incurred in an incident involving one of your independent contractors, Yolanda Sanchez, on March 1, 2021, at approximately 10 AM in Phoenix, Arizona.

    As I was driving behind Ms. Sanchez, she suddenly slammed on her brakes to make a turn into a driveway without any warning or indication, causing me to collide into the back of her vehicle. The impact of the collision caused her vehicle to lurch forward and subsequently collide with Leslie Erdman's parked car on the street in front of the delivery address.

    As a result of this chain reaction collision, I sustained minor injuries, including whiplash and bruising from the seatbelt. Additionally, my vehicle sustained significant front-end damage. Yolanda Sanchez was found to be at fault for the incident, which has led me to file this auto liability claim against her and Myriad Delivery Services.

    I kindly request that you investigate this matter and provide a response to my claim by next week. Please find the attached documents, including a copy of the police report, photographs of the damages to all three vehicles, and medical records detailing my injuries, to support my claim.

    I understand that accidents happen, but it is essential that your independent contractors exercise caution and adhere to safe driving practices while conducting business on behalf of Myriad Delivery Services. I appreciate your prompt attention to this matter and look forward to a fair resolution.

    Sincerely,

    Emma Wolff
    ------

    PEDESTRIAN is defined as "Claims that specifically mention accidents or incidents with pedestrians."
    TRUE or FALSE, this insurance claim should be classified as PEDESTRIAN.
    Response:
    FALSE
    `,
]

export async function _binaryClassify(
    document: string, 
    label: BinaryClassifyLabel, 
    documentType: string = "document", 
    model: string = "text-davinci-003", 
    examples: string[] = individualExamples, 
    promptPrefix?: string): Promise<LabelResult | null> {
    const examplePartial = `${examples.map((ex) => `${ex}\n`).join("")}`;
    if (!promptPrefix) {
        promptPrefix = `Classify this ${documentType} as {label}, answer TRUE or FALSE.`
    }

    let prompt = 
    outdent`
    ${examplePartial}
    Document:
    ${document}
    
    ${label.name} is defined as "${label.description}"
    ${promptPrefix.replace('{label}', label.name)}
    Response:
    `;
    // console.log(prompt)
    
    const response = await openaiCompletion(prompt, 5, 0, model);
    console.log(response)
    const classified = response.choices[0].text!.trim().toUpperCase() === "TRUE";
    if (classified) {
        const top_logprobs = response.choices[0].logprobs!.top_logprobs! as Array<{[key: string]: number}>;
        // remove the first token if it's a newline
        if (top_logprobs[0]["\n"]) {
            top_logprobs.shift();
        }
        const score = top_logprobs.reduce((acc, cur) => {
            return acc + Object.values(cur)[0];
        }
        , 0);
        const probability = Math.exp(score)
        return { label: label.name, confidence: probability };
    }
    else {
        return null;
    }
} 
export const binaryClassify = traceFunction(_binaryClassify);

async function _classifyCategory(
    document: string, 
    category: SelectCategoryLabel,
    documentType: string = "document", 
    model: string = "text-davinci-003", 
    promptPrefix?: string, 
    examples?: string[]): Promise<LabelResult> {
    const examplePartial = examples ? `${examples.map((ex) => `${ex}\n`).join("")}` : outdent`
    Document:
    I need to cancel my flight from New York to Los Angeles on July 4th.
    
    Select one of the following labels for this document:
    CANCEL_FLIGHT is defined as "Claims that specifically mention cancelling a flight."
    CHANGE_FLIGHT is defined as "Claims that specifically mention changing a flight."
    DELAYED_FLIGHT is defined as "Claims that specifically mention a delayed flight."
    
    Response:
    CANCEL_FLIGHT`;

    // determine the label with the maximum number of tokens
    const lengths = category.children.map(async (label) => await numTokens(label.name, "text-davinci-003"))
    const max = Math.max(...(await Promise.all(lengths))) + 1   

    if (!promptPrefix) {
        promptPrefix = `Select one of the following labels for this ${documentType}:`
    }
    const prompt = outdent`
    ${examplePartial}
    Document:
    ${document}
    
    ${promptPrefix}
    ${category.children.map((label) => `${label.name} is defined as: ${label.description}\n`).join("")}
    Response:
    `;

    const response = await openaiCompletion(prompt, max, 0, model);
    console.log(response)
    
    // get the top logprobs for the label
    const top_logprobs = response.choices[0].logprobs!.top_logprobs as Array<{[key: string]: number}>;
    // remove the first token if it's a newline
    if (top_logprobs[0]["\n"]) {
        top_logprobs.shift();
    }
    const score = top_logprobs.reduce((acc, cur) => {
        return acc + Object.values(cur)[0];
    }
    , 0);
    const label = response.choices[0].text!.trim();
    // Math.exp(score)
    const probability = Math.exp(score)
    return { label, confidence: probability };
}
export const classifyCategory = traceFunction(_classifyCategory);

export async function _processHeirarchicalLabels(document: string, labels: HierarchicalLabel[], documentType: string, model: string): Promise<LabelResult[]> {
    let results: LabelResult[] = [];
    for (let label of labels) {
        if (label.type === LabelType.BINARY_CLASSIFY) {
            const result = await binaryClassify(document, label as BinaryClassifyLabel, documentType, "bart");
            if (result) {
                results.push(result);
                if (label.children) {
                    results.push(...await processLabelHeirarchy(document, label.children, documentType, model));
                }
            }
        } else if (label.type === LabelType.SELECT_CATEGORY) {
            const result = await classifyCategory(document, label as SelectCategoryLabel, documentType, model);
            if (result) {
                results.push({...result, type: label.name});
                if (label.children) {
                    // only process the child label that was selected
                    const childLabel = label.children.find((child) => child.name === result.label);
                    if (childLabel) {
                        results.push(...await processLabelHeirarchy(document, [childLabel], documentType, model));
                    }
                }
            }
        } else if (label.type === LabelType.CATEGORY && label.children) {
            results.push(...await processLabelHeirarchy(document, label.children, documentType, model));
        }
    }
    return results;
}
export const processLabelHeirarchy = traceFunction(_processHeirarchicalLabels);

async function _flattenLabels(labels: HierarchicalLabel[]): Promise<BaseLabel[]> {
    let flattened: BaseLabel[] = [];
    for (let label of labels) {
        if (label.type === LabelType.BINARY_CLASSIFY || label.type === LabelType.CATEGORY) {
            flattened.push({name: label.name, description: label.description});
        }
        // check if label.children is defined
        if (label.children) {
            if (Array.isArray(label.children) && label.children.length > 0) {
                flattened.push(...(await _flattenLabels(label.children as HierarchicalLabel[])));
            }
        }
    }
    return flattened;
}
export const flattenLabels = traceFunction(_flattenLabels);

async function _findNode(labelList: HierarchicalLabel[], name: string): Promise<HierarchicalLabel | null> {
    for (const label of labelList) {
        if (label.name === name) {
            return label;
        } else {
            const foundInChild = findNode(label.children!, name);
            if (foundInChild) {
                return foundInChild;
            }
        }
    }
    
    return null;
}
export const findNode = traceFunction(_findNode);