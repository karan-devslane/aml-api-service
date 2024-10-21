export interface Taxonomy {
  // Define the structure of your taxonomy here, for example:
  board: { identifier: string; name: { [key: string]: string } };
  class: { identifier: string; name: { [key: string]: string } };
  l1_skill: { identifier: string; name: { [key: string]: string } };
  l2_skill: { identifier: string; name: { [key: string]: string } }[];
  l3_skill: { identifier: string; name: { [key: string]: string } }[];
}
