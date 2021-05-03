import * as d3 from 'd3';
import { Link } from '../models/NodeLinkGraph';

export function createLinkWidthScale(links: Link[]): any {
  const linkScale = d3
    .scaleLinear()
    .domain([
      Math.min(...links.map((linkData: any) => linkData.tags.length)),
      Math.max(...links.map((linkData: any) => linkData.tags.length)),
    ])
    .range([1, 10]);
  return linkScale;
}
