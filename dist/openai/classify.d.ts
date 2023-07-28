type AtLeastOne<T> = [T, ...T[]];
export declare enum LabelType {
    CATEGORY = "category",
    SELECT_CATEGORY = "select-category",
    BINARY_CLASSIFY = "binary-classify"
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
export declare function _binaryClassify(document: string, label: BinaryClassifyLabel, documentType?: string, model?: string, examples?: string[], promptPrefix?: string): Promise<LabelResult | null>;
export declare const binaryClassify: typeof _binaryClassify;
declare function _classifyCategory(document: string, category: SelectCategoryLabel, documentType?: string, model?: string, promptPrefix?: string, examples?: string[]): Promise<LabelResult>;
export declare const classifyCategory: typeof _classifyCategory;
export declare function _processHeirarchicalLabels(document: string, labels: HierarchicalLabel[], documentType: string, model: string): Promise<LabelResult[]>;
export declare const processLabelHeirarchy: typeof _processHeirarchicalLabels;
declare function _flattenLabels(labels: HierarchicalLabel[]): Promise<BaseLabel[]>;
export declare const flattenLabels: typeof _flattenLabels;
declare function _findNode(labelList: HierarchicalLabel[], name: string): Promise<HierarchicalLabel | null>;
export declare const findNode: typeof _findNode;
export {};
