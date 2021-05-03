interface CategoryText {
    color: any;
    id: number;
    text: string;
  }
  export class Node implements d3.SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    id: string | number;
    data_entity_text!: string;
    sourceLinks?: any;
    targetLinks?: any;
    hostName!: string;
    categories?: CategoryText[];
  
    constructor(id: string) {
      this.id = id;
    }
  }
  
  export class Link implements d3.SimulationLinkDatum<Node> {
    index?: number;
    source: Node | string | number | any;
    target: Node | string | number | any;
    tag_text?: string;
  
    constructor(source: any, target: any, value: number) {
      this.source = source;
      this.target = target;
    }
  }
  
  export interface PieData {
    category: number;
    categoryName: string;
    color: string;
    value: number;
  }