# Ariadne: Navigating Information Labyrinths with Ease 📚🔍

> "*Ariadne gave him a ball of thread, and instructed him to unravel it as he penetrated deeper and deeper into the Labyrinth, so that he could find his way out when the Beast was slain.*" - Theseus and the Minotaur

<p align="center">
    <img src="ariadne.png" width="450" >
</p>

Ariadne, named after the Greek mythology heroine who helped Theseus navigate the labyrinth of the Minotaur, is a document search and inference library. It is designed to assist users to navigate through the labyrinthine complexity of dense information. Just as Ariadne's thread guided Theseus, our library helps in understanding and exploring documents and articles that won't fit into a single context window! 🐂

## Intent 🎯
The primary intent behind Ariadne is to facilitate a simple abstraction for single document search. It is designed to be fast and efficient for single documents of less than 1000 pages. Ariadne can build several types of indices, starting with the document embedding index, a document-aware structure. It allows you to search over chunks or individual pages and filter chunks by page and tags. Ariadne is all about pre-processing, making it clean and optimized for users! 💡

## Getting Started 🚀

Here's a quick guide on how to get started with Ariadne. Fasten your seatbelts!

## Pre-requisites 📋

Before starting, ensure that you have Node.js installed on your system. Ariadne is built with TypeScript but runs on Node.js.
Poppler will also need to be installed in order to read PDFs.

## Installation 💽

To install Ariadne, use the following command in your terminal:

```bash
# not published yet
# yarn install ariadne
```

## Basic Usage 🛠️

### Indexing a Document

The first step is to index a document using Ariadne. Here is a simple example where we extract pages from a PDF, index it, and run a query on the index:

```javascript
import { DocumentIndex, extractPdf } from "ariadne";
const pages = await extractPdf(documentPath);
const index = await DocumentIndex.fromPages(pages);

const query = "Your Query Here";
const results = await index.query(query, 3);

console.log(`Search Results: ${JSON.stringify(results, null, 2)}`);
```

Voila! You have successfully indexed a document and ran a query on it using Ariadne. Now you are ready to explore the labyrinth of information in your documents with Ariadne! 🎉

For more detailed examples, please visit the `examples` folder in the repository. Happy coding! 💻


### Document Loaders 📂

Ariadne has been designed to be versatile. It understands documents, consists of pages, and chunks individual pages. We have abstracted a PDF document loader that can take a PDF and return pages. In the future, we plan on building doc loaders and other types of document loaders.

### Embedding Models 🤖

Ariadne uses the OpenAI embedding function on the front end. However, the beauty of Ariadne is that we can replace this with a multitude of different embedding models. In the future, we're looking to replace the OpenAI embeddings with the universal sentence encoder and other models, increasing our flexibility and model sovereignty.

### PDF Extraction 📑

Ariadne features a powerful text PDF extraction function, using the 'PDF to text' command. While this currently writes to a file, we're aiming to output to standard out to increase flexibility and possibly run this within a Docker container.

## What's Next? 🔮
Well, we have a lot planned! We're looking to abstract the document embedding into an interface, construct a backend to store all embeddings, work on cleaning up the tracing implementation, write up some docs, and set up package distribution and publishing. We're also exploring whether we should make this library open source or keep it as a core piece of our IP.

## Documentation 📚
*Coming soon!*

## To Do List 📝
- [ ] Clean up the tracing implementation.
- [ ] Design and Implement `BaseIndex` class, designed to be subclassed 
- [ ] Implement `TextIndex` which is designed to index arbitrary text
- [ ] Implement `WebsiteIndex` which is designed to crawl and index text from webpages
- [ ] Setup package distribution and publishing
- [ ] Evaluate the potential for open sourcing

## Conclusion 🎁
Ariadne aims to make navigating dense documents as simple as possible. We're in the early stages and excited about the potential this library holds. We hope it will be as helpful to you as Ariadne's thread was to Theseus! 💫
