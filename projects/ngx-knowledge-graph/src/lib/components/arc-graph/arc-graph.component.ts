import {
  AfterContentInit,
  ElementRef,
  Host,
  ViewChild,
  Component,
  OnInit,
  HostListener,
  Input,
} from '@angular/core';
import * as d3 from 'd3';
import { max } from 'lodash';
import { fromEvent } from 'rxjs';
import { tap, debounceTime } from 'rxjs/operators';
import { Node, Link, PieData } from '../../models/NodeLinkGraph';
import { createCategoryLegend, setStyle } from '../../shared/legend';
import { createLinkWidthScale } from '../../shared/linkScale';
import { KnowledgeGraph } from '../../models/KnowledgeGraph';
import { Category } from '../../models/Category';

@Component({
  selector: 'lib-arc-graph',
  templateUrl: './arc-graph.component.html',
  styleUrls: ['./arc-graph.component.css']
})
export class ArcGraphComponent implements OnInit, AfterContentInit  {
  @ViewChild('arcSVG')
  arcSVGRef!: ElementRef<SVGElement>;
  @Input() showCategories = true;
  @Input() showLinkStrength = true;
  loading = false;
  data!: KnowledgeGraph;
  selectedNodeData: any;
  nodeRadius = 7;
  private arcRadius = 10;
  allCategories!: Category[];
  legendState!: Map<number, boolean>;
  legendScale = 2;
  legendFontSize = 15;
  legendTextBottomMargin = 5;
  private graphLinks: any;
  private graphNodes: any;
  private linkWidthScale: any;
  @HostListener('document:click', ['$event'])
  clickout(event: any): void {
    if (!this.host.nativeElement.contains(event.target)) {
      d3.select('div.fehris-arc-graph>div').remove();
      if (this.graphNodes !== undefined && this.graphLinks !== undefined) {
        this.graphNodes.selectAll('*').style('opacity', 1);
        this.graphLinks.style('stroke-opacity', 0.5);
      }
    }
  }

  constructor(
    @Host() private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.renderArcGraph();
  }

  ngAfterContentInit(): void {
    fromEvent(window, 'resize')
      .pipe(
        tap(() => (this.loading = true)),
        debounceTime(300),
      )
      .subscribe(() => {
        this.renderArcGraph();
        this.loading = false;
      });
  }

  renderArcGraph(): void {
    const { width } = this.host.nativeElement.getBoundingClientRect();
    const svg = d3.select('svg');
    svg.selectAll('g').remove();
    svg.selectAll('path').remove();
    svg.selectAll('circle').remove();
    svg.selectAll('text').remove();
    d3.selectAll('#ARC-CategoryLegend').selectAll('*').remove();
    this.drawArcGraph(this.data, width);
  }

  drawArcGraph(data: { nodes: Node[]; links: Link[] }, width: number): void {
    this.linkWidthScale = createLinkWidthScale(data.links);


    const margin = { top: 0, right: 30, bottom: 30, left: 100 };
    width = width - margin.left - margin.right;

    const idToNode: Node | any = {};
    data.nodes.forEach(n => {
      idToNode[n.id] = n;
    });
    const allNodes: string[] = data.nodes.map(d => d?.data_entity_text!);
    const yScale = d3
      .scalePoint()
      .range([15, width - 10])
      .domain(allNodes);

    const allYScalePos: (number | undefined)[] = data.links.map((d: any) =>
      yScale(idToNode[d.target].data_entity_text),
    );
    let height: number | undefined;
    allYScalePos
      ? (height = max(allYScalePos))
      : ({ height } = this.host.nativeElement.getBoundingClientRect());

    const svg = d3.select('svg');
    svg.attr('width', width);
    height ? svg.attr('height', height + 10) : svg.attr('height', 800);
    if (this.showCategories) {
      setStyle(svg);
    }
    const drawArc = (linkData: any) => {
      const start = yScale(idToNode[linkData.source].data_entity_text)!;
      const end = yScale(idToNode[linkData.target].data_entity_text)!;
      return [
        'M',
        125,
        start,
        'A',
        (start - end) / 2,
        ',',
        (start - end) / 2,
        0,
        0,
        ',',
        start < end ? 1 : 0,
        125,
        end,
      ].join(' ');
    };

    this.graphLinks = this.createGraphLinks(svg, data, drawArc);

    this.graphNodes = this.createGraphNodes(svg, data, margin.left, yScale);

    this.createGraphLabels(svg, data, margin.left, yScale);

    this.createGraphNodeEvents(this.graphLinks, this.graphNodes);

    this.createNodeArcs(this.graphNodes, 'id');
    // createCategoryLegend(
    //   svg,
    //   this.allCategories,
    //   'arcCategory',
    //   this.legendState,
    //   (2 * width) / 3,
    //   this.legendFontSize,
    //   this.legendTextBottomMargin,
    //   this.showCategories,
    // );

    this.graphLinks.on('click', () => {
      d3.select('div.fehris-arc-graph>div').remove();
    });

    // const addTooltip = (event: any) => {
    //   showStuffCard('fehris-arc-graph', event, this.selectedNodeData[0]);
    // };
  }
  private createGraphNodeEvents(
    graphLinks: any,
    graphNodes: any,
  ): void {
    graphNodes
      .on('mouseover', (event: any, nodeData: any) => {
        d3.select(event.target).style('stroke', '#3f51b5').style('stroke-width', '5');
        d3.selectAll(`path.id${nodeData.id}`).style('stroke', '#4576d1').style('stroke-width', '5');
      })
      .on('mouseout', (event: any, nodeData: any) => {
        d3.select(event.target).style('stroke', '#666').style('stroke-width', '1');
        d3.selectAll(`path.id${nodeData.id}`)
          .style('stroke', '#999')
          .style('stroke-width', (linkData: any) =>
            this.showLinkStrength ? this.linkWidthScale(linkData.tags.length) : '1',
          );
      })
      .on('click', (event: any, nodeData: Node) => {
        graphNodes.selectAll(`:not(.id${nodeData.id})`).style('opacity', 0.1);
        graphLinks.each((linkData: any) => {
          if (linkData.source === nodeData.id) {
            graphNodes.selectAll(`.id${linkData.target}`).style('opacity', 1);
          }
          if (linkData.target === nodeData.id) {
            graphNodes.selectAll(`.id${linkData.source}`).style('opacity', 1);
          }
        });
        graphLinks.style('stroke-opacity', (linkData: any) =>
          linkData.source === nodeData.id || linkData.target === nodeData.id ? 1 : 0.1,
        );
      });
  }

  private createGraphLabels(
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
    data: { nodes: Node[]; links: Link[] },
    leftMargin: number,
    yScale: d3.ScalePoint<string>,
  ): any {
    const graphLabels = svg
      .selectAll('dataEntityLabels')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('x', leftMargin + 20)
      .attr('y', 0)
      .text((nodeData: any) => nodeData.hostName)
      .style('text-anchor', 'end')
      .attr(
        'transform',
        (nodeData: any) => 'translate(0,' + yScale(nodeData.data_entity_text) + ')',
      )
      .style('font-size', 12);

    return graphLabels;
  }

  private createGraphNodes(
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
    data: { nodes: Node[]; links: Link[] },
    leftMargin: number,
    yScale: d3.ScalePoint<string>,
  ): any {
    const graphNodes = svg
      .append('g')
      .selectAll('.node')
      .data(data.nodes)
      .join('g')
      .attr('transform', (nodeData: any) => {
        return `translate(${leftMargin + 30},${(nodeData.y = yScale(nodeData.data_entity_text))})`;
      })
      .attr('class', 'node')
      .attr('pointer-events', 'visible');

    graphNodes.append('title').text((nodeData: any) => nodeData.data_entity_text);
    return graphNodes;
  }

  private createGraphLinks(
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>,
    data: { nodes: Node[]; links: Link[] },
    drawArc: (linkData: any) => string,
  ): any {
    const graphLinks = svg
      .append('g')
      .attr('class', 'tags')
      .selectAll('tags')
      .data(data.links)
      .enter()
      .append('path')
      .attr('d', linkData => drawArc(linkData))
      .style('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.5)
      .style('stroke-width', (linkData: any) =>
        this.showLinkStrength ? this.linkWidthScale(linkData.tags.length) : '1',
      )
      .attr('class', (linkData: any) => {
        const sourceCategories = data.nodes.find(nodeData => nodeData.id === linkData.source)
          ?.categories;
        const targetCategories = data.nodes.find(nodeData => nodeData.id === linkData.target)
          ?.categories;
        return (
          'id' +
          linkData.source +
          ' id' +
          linkData.target +
          ' arcCategory' +
          sourceCategories?.map((category: any) => category.id).join(' arcCategory') +
          ' arcCategory' +
          targetCategories?.map((category: any) => category.id).join(' arcCategory')
        );
      })
      .on('mouseover', (event: any, linkData: Link) => {
        d3.select(event.target).style('stroke', '#4576d1').style('stroke-width', '5');
      })
      .on('mouseout', event => {
        d3.select(event.target)
          .style('stroke', '#999')
          .style('stroke-width', (linkData: any) =>
            this.showLinkStrength ? this.linkWidthScale(linkData.tags.length) : '1',
          );
      });

    graphLinks
      .append('title')
      .text((linkData: any) => linkData.tags.map((tag: any) => tag.text).join(' '));

    return graphLinks;
  }

  showColorsOnNodes(): void {
    this.showCategories = !this.showCategories;
    d3.selectAll('.arcs').attr('visibility', this.showCategories ? 'visible' : 'hidden');
    d3.selectAll('.categoryLegend').attr('visibility', this.showCategories ? 'visible' : 'hidden');
  }

  createNodeArcs(node: any, classSuffix: string): void {
    const categoryArc = d3.arc().innerRadius(this.nodeRadius).outerRadius(this.arcRadius);

    node
      .append('circle')
      .attr('r', this.nodeRadius)
      .attr('id', (nodeData: any) => nodeData.id)
      .attr('class', (nodeData: any) => {
        return (
          classSuffix +
          nodeData.id +
          ' arcCategory' +
          nodeData.categories.map((category: any) => category.id).join(' arcCategory')
        );
      })
      .attr('fill', '#3b3939')
      .each((nodeData: any, index: any) => {
        const pieData: PieData[] = [];
        nodeData.categories.forEach((element: any) => {
          pieData.push({
            category: element.id,
            categoryName: element.text,
            color: element.color,
            value: 1 / nodeData.categories.length,
          });
        });
        const GlobalVariables = Object.freeze({
          pie: d3.pie<PieData>().value(data => data.value),
        });
        const arcData = GlobalVariables.pie(pieData);
        const selectedNode = node.filter((element: any, id: any) => {
          return id === index;
        });
        selectedNode
          .selectAll()
          .data(arcData)
          .enter()
          .append('path')
          .attr('fill', (category: any) => category.data.color)
          .attr('d', categoryArc)
          .attr(
            'class',
            (category: any) => `id${nodeData.id} arcCategory${category.data.category} arcs`,
          )
          .attr('visibility', () => (this.showCategories ? 'visible' : 'hidden'))
          .append('title')
          .text((category: any) => category.data.categoryName);
      });
    node.append('title').text((nodeData: any) => nodeData.id);
  }

  toggleLinkStrength(): void {
    this.showLinkStrength = !this.showLinkStrength;
    this.graphLinks.style('stroke-width', (d: any) =>
      this.showLinkStrength ? this.linkWidthScale(d.tags.length) : '1',
    );
  }
}

