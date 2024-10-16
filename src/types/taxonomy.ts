export interface Taxonomy {
  // Define the structure of your taxonomy here, for example:
  board: { id: number; name: { [key: string]: string } };
  class: { id: number; name: { [key: string]: string } };
  l1_skill: { id: number; name: { [key: string]: string } };
  l2_skill: { id: number; name: { [key: string]: string } }[];
  l3_skill: { id: number; name: { [key: string]: string } }[];
}