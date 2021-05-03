import { Node, Link } from './NodeLinkGraph';

export interface KnowledgeGraph {
  nodes: Node[];
  links: [
    Link & {
      tag_text: string;
      id: number;
    },
  ];
}