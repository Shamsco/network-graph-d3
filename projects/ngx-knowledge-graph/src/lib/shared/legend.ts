import * as d3 from 'd3';
import { Category } from '../models/Category';

export function createCategoryLegend(
  svg: any,
  catergoriesArray: Category[],
  classSuffix: string,
  legendState: Map<number, boolean>,
  xPos: number,
  legendFontSize: number,
  legendTextBottomMargin: number,
): void {
  legendState = new Map<number, boolean>();
  catergoriesArray.forEach((category: any) => {
    legendState.set(category.id, false);
  });
  svg
    .append('g')
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .attr('font-family', 'sans-serif')
    .attr('font-size', legendFontSize)
    .attr('text-anchor', 'start')
    .attr('class', 'categoryLegend')
    .attr('opacity', 1)
    .selectAll('g')
    .data(catergoriesArray)
    .join('g')
    .attr(
      'transform',
      (category: any, index: any) =>
        `translate(${xPos},${index * (legendFontSize + legendTextBottomMargin) + 10})`,
    )
    .call((g: any) =>
      g
        .append('text')
        .attr('x', 6)
        .attr('y', '0.35em')
        .attr('class', (category: any) => classSuffix + category.id)
        .attr('fill', (category: any) => (category.color ? category.color : '#c3c3c3'))
        .text((category: any) => category.text),
    )
    .call((g: any) =>
      g
        .append('circle')
        .attr('r', 5)
        .attr('class', (category: any) => classSuffix + category.id + ' legendNodes')
        .attr('fill', (category: any) => (category.color ? category.color : '#c3c3c3')),
    )
    .on('mouseover', (event: any, category: any) => {
      d3.selectAll(`text.${classSuffix + category.id}`).classed('hover', true);
    })
    .on('mouseout', (event: any, category: any) => {
      d3.selectAll(`text.${classSuffix + category.id}`).classed('hover', false);
    })
    .on('click', (event: any, category: any) => {
      selectGroup(category.id, classSuffix, legendState);
    });
}

export function selectGroup(
  categoryID: number,
  classSuffix: string,
  legendState: Map<number, boolean>,
): void {
  let hasTrue = false;
  if (legendState.get(categoryID) === true) {
    legendState.set(categoryID, false);
  } else if (legendState.get(categoryID) === false) {
    legendState.set(categoryID, true);
  }
  d3.selectAll(`line`).classed('inactive', true);
  d3.selectAll(`path`).classed('inactive', true);
  d3.selectAll(`circle`).classed('inactive', true);
  legendState.forEach((category, key) => {
    if (category === true) {
      hasTrue = true;
    }
  });
  if (hasTrue) {
    legendState.forEach((element, key) => {
      if (element) {
        d3.selectAll(`.${classSuffix + key}`).classed('gactive', true);
        d3.selectAll(`.${classSuffix + key}`).classed('inactive', false);
      } else {
        d3.selectAll(`.${classSuffix + key}`).classed('gactive', false);
      }
    });
  } else {
    legendState.forEach((element, key) => {
      d3.selectAll(`.${classSuffix + key}`).classed('gactive', false);
      d3.selectAll(`.${classSuffix + key}`).classed('inactive', false);
    });
    d3.selectAll(`line`).classed('inactive', false);
    d3.selectAll(`path`).classed('inactive', false);
    d3.selectAll(`circle`).classed('inactive', false);
  }
}

export function setStyle(svg: any): void {
  svg.append('style').text(`
    text.hover {
      font-weight: bold;
    }
    line:hover{
      stroke: #000;
      stroke-opacity: 1;
    }
    line.pactive {
      stroke: #000;
      stroke-opacity: 1;
    }
    circle.pactive{
      stroke: #000;
    }
    line.gactive {
      stroke-opacity: 1;
    }
    text.gactive{
      font-weight: bold;
      font-size: 25;
    }
    .inactive {
      fill: #808080;
      opacity: 0.4;
    }
    line.inactive {
      stroke-opacity: 0.4;
    }
    `);
}
