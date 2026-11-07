import { definitions } from "./definitions";
import { documents } from "./documents";

// Creating a new constant 'schemaTypes' which is a copy of the 'documents' array
export const schemaTypes = [...documents, ...definitions];

// Creating a new constant 'schemaNames' which is an array of names extracted from the 'documents' array
export const schemaNames = [...documents].map((doc) => doc.name);

// Defining a new type 'SchemaType' which is a union of all the types in the 'schemaNames' array
export type SchemaType = (typeof schemaNames)[number];

// Exporting the 'schemaTypes' constant as the default export of this module
export default schemaTypes;
