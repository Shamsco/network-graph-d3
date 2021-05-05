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
import { fromEvent } from 'rxjs';
import { tap, debounceTime } from 'rxjs/operators';
import { Node, Link, PieData } from '../../models/NodeLinkGraph';
import { createCategoryLegend, setStyle } from '../../shared/legend';
import { createLinkWidthScale } from '../../shared/linkScale';
import { KnowledgeGraph } from '../../models/KnowledgeGraph';
import { Category } from '../../models/Category';

@Component({
  selector: 'network-graph',
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.scss']
})
export class NetworkGraphComponent implements OnInit, AfterContentInit {
  @ViewChild('networkSVG')
  networkSVGRef!: ElementRef<SVGElement>;
  @Input() showCategories = true;
  @Input() showLinkStrength = true;
  loading = false;
  @Input() data!: KnowledgeGraph;
  @Input() hasCategories: boolean = false;
  @Input() hasLinkStrength: boolean = false;
  @Input() height!: number;
  @Input() width!: number;
  nodeRadius = 7;
  arcRadius = 10;
  allCategories!: Category[];
  legendState!: Map<number, boolean>;
  legendScale = 2;
  legendFontSize = 15;
  legendTextBottomMargin = 5;
  maxZoom = 4;
  minZoom = 1;
  private graphLinks: any;
  private graphNodes: any;
  private linkWidthScale: any;
  private drag = (simulation: any) => {
    const dragStarted = (event: any) => {
      if (!event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event: any) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragEnded = (event: any) => {
      if (!event.active) {
        simulation.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    };

    return d3
      .drag<SVGGElement, unknown>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded);
  };

  @HostListener('document:click', ['$event'])
  clickout(event: any): void {
    if (!this.host.nativeElement.contains(event.target)) {
      d3.select('div.fehris-network-graph>div').remove();
      d3.selectAll('circle:not(.legendNodes)').style('fill', '#3b3939');
    }
  }

  constructor(
    @Host() private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.renderNetworkGraph();
  }

  ngAfterContentInit(): void {
    fromEvent(window, 'resize')
      .pipe(
        tap(() => (this.loading = true)),
        debounceTime(300),
      )
      .subscribe(() => {
        this.renderNetworkGraph();
        this.loading = false;
      });
  }

  renderNetworkGraph(): void {
    const { width } = this.host.nativeElement.getBoundingClientRect();
    const height = width / (16 / 9);
    const svg = d3.select('svg');
    svg.selectAll('g').remove();
    svg.selectAll('path').remove();
    svg.selectAll('circle').remove();
    d3.selectAll('#CategoryLegend').selectAll('*').remove();
    this.drawNetworkGraph(this.data?.nodes, this.data?.links, width, (height + 125) / 2);
  }

  drawNetworkGraph(nodes: Node[], links: Link[], width: number, height: number): void {
    console.log(links)
    console.log(nodes)
    
    height = height * nodes.length/50;
    width = width * nodes.length/50;


    this.linkWidthScale = createLinkWidthScale(links);

    const zoomSlider = d3.select('input#zoom');
    // Zoom functionality
    const zoom: any = d3.zoom().scaleExtent([this.minZoom, this.maxZoom]);

    zoomSlider
      .datum({})
      .attr('type', 'range')
      .attr('value', zoom.scaleExtent()[0])
      .attr('min', zoom.scaleExtent()[0])
      .attr('max', zoom.scaleExtent()[1])
      .attr('step', (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100);

    const svg = d3
      .select('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMid')
      .append('g')
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity);

    if (this.showCategories) {
      setStyle(svg);
    }
    // Bounding Rect for Zoom
    const zoomRect = svg
      .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('fill', 'none')
      .style('pointer-events', 'all');
    const container = svg.append('g');

    zoom.on('zoom', (event: any) => {
      container.attr('transform', event.transform);
      zoomSlider.property('value', event.transform.k);
    });
    zoomSlider.on('input', (event: any) => {
      zoom.scaleTo(container.transition().duration(750), d3.select(event.target).property('value'));
    });
    const mainGraphSimulation = this.createSimulation(nodes, width / 2, height / 2, links);

    this.graphLinks = this.createGraphLinks(container, links);

    this.graphNodes = this.createGraphNodes(container, nodes);

    this.graphNodes.call(this.drag(mainGraphSimulation));

    // this.graphNodes.on('click', (event: any, nodeData: Node) => {
    //   d3.selectAll('circle:not(.legendNodes)').style('fill', '#3b3939');
    //   d3.select(event.target).style('stroke', '#3f51b5').style('stroke-width', '5');
    //   addTooltip(event, nodeData.id);
    //   d3.selectAll(`circle.id${nodeData.id}`).style('fill', '#12d');
    // });

    this.createNodeArcs(this.graphNodes, 'id');
    // createCategoryLegend(
    //   svg,
    //   this.allCategories,
    //   'category',
    //   this.legendState,
    //   15,
    //   this.legendFontSize,
    //   this.legendTextBottomMargin,
    // );

    const addTooltip = (event: any, id: any) => {
      this.createPreview(id, nodes, links, height, width);
    };

    this.graphUpdate(mainGraphSimulation, this.graphLinks, this.graphNodes);
  }
  private graphUpdate(graphSimulation: any, graphLinks: any, graphNodes: any): void {
    graphSimulation.on('tick', () => {
      graphLinks
        .attr('x1', (linkData: any) => linkData.source.x)
        .attr('y1', (linkData: any) => linkData.source.y)
        .attr('x2', (linkData: any) => linkData.target.x)
        .attr('y2', (linkData: any) => linkData.target.y);

      graphNodes.attr('transform', (nodeData: any) => `translate(${nodeData.x}, ${nodeData.y})`);
    });
  }

  private createGraphNodes(container: any, nodes: Node[]): any {
    const graphNodes = container
      .append('g')
      .selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('pointer-events', 'visible');

    graphNodes
      .on('mouseover', (event: any, nodeData: any) => {
        d3.select(event.target).style('stroke', '#3f51b5').style('stroke-width', '5');
        d3.selectAll(`line.id${nodeData.id}`).style('stroke', '#4576d1').style('stroke-width', '5');
      })
      .on('mouseout', (event: any, nodeData: any) => {
        d3.select(event.target).style('stroke', '#666').style('stroke-width', '1');
        d3.selectAll(`line.id${nodeData.id}`)
          .style('stroke', '#999')
          .style('stroke-width', (linkData: any) =>
            this.showLinkStrength ? this.linkWidthScale(linkData.tags.length) : '1',
          );
      })
      .on('dblclick', () => {
        d3.select('div.fehris-arc-graph>div').remove();
      });

    return graphNodes;
  }

  private createGraphLinks(container: any, links: Link[]): any {
    const graphLinks = container
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('pointer-events', 'visible')
      .attr('class', (linkData: any) => {
        return (
          'id' +
          linkData.source.id +
          ' id' +
          linkData.target.id +
          ' category' +
          linkData.source.categories.map((category: Category) => category.id).join(' category') +
          ' category' +
          linkData.target.categories.map((category: Category) => category.id).join(' category')
        );
      })
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', (linkData: any) => {
        return this.showLinkStrength ? this.linkWidthScale(linkData.tags.length) : '1';
      })
      .on('mouseover', (event: any, linkData: Link) => {
        d3.select(event.target).style('stroke', '#4576d1').style('stroke-width', '5');
      })
      .on('mouseout', (event: any) => {
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

  private createSimulation(nodes: Node[], width: number, height: number, links: Link[]): any {
    return d3
      .forceSimulation()
      .velocityDecay(0.1)
      .nodes(nodes)
      .force('x', d3.forceX(width).strength(0.05))
      .force('y', d3.forceY(height).strength(0.05))
      .force(
        'link',
        d3.forceLink(links).id((d: any) => d.id),
      )
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width, height))
      .force('collision', d3.forceCollide().radius(this.arcRadius));
  }

  createNodeArcs(node: any, classSuffix: string): void {
    const categoryArc = d3.arc().innerRadius(this.nodeRadius).outerRadius(this.arcRadius);

    node
      .append('circle')
      .attr('r', this.nodeRadius)
      .attr('class', (nodeData: any) => {
        return (
          classSuffix +
          nodeData.id +
          ' category' +
          nodeData.categories.map((category: any) => category.id).join(' category')
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
          .attr('class', (category: any) => `category${category.data.category} arcs`)
          .attr('visibility', () => (this.showCategories ? 'visible' : 'hidden'))
          .append('title')
          .text((category: any) => category.data.categoryName);
      });
    node.append('title').text((nodeData: any) => nodeData.data_entity_text);
  }

  showColorsOnNodes(): void {
    d3.selectAll('.arcs').attr('visibility', this.showCategories ? 'visible' : 'hidden');
    d3.selectAll('#CategoryLegend').attr('visibility', this.showCategories ? 'visible' : 'hidden');
  }
  // Method that creates the tooltip Window
  private createPreview(
    id: any,
    inputNodes: Node[],
    inputLinks: Link[],
    height: number,
    width: number,
  ): void {
    // Data Processing to use only Nodes linked to selected Node
    const linksFilter: Link[] = inputLinks.filter(
      linkData => linkData.source.id === id || linkData.target.id === id,
    );

    const nodesFilter = new Array<Node>();
    let nodeFound: any = inputNodes.find(searchNode => searchNode.id === id);
    if (nodeFound !== undefined) {
      nodesFilter.push(nodeFound);
    }

    for (const values of linksFilter) {
      if (values.source.id === id) {
        nodeFound = inputNodes.find(nodeData => nodeData.id === values.target.id);
        if (nodeFound !== undefined) {
          nodesFilter.push(nodeFound);
        }
      }
      if (values.target.id === id) {
        nodeFound = inputNodes.find(nodeData => nodeData.id === values.source.id);
        if (nodeFound !== undefined) {
          nodesFilter.push(nodeFound);
        }
      }
    }
    const toolTipHeight = (height - 50) / 2;
    const tooltipWidth = 300;
    const toolTipSimulation = this.createSimulation(
      nodesFilter,
      tooltipWidth,
      toolTipHeight,
      linksFilter,
    );

    const toolTipSvg = d3.select('div#nodeTooltip-graph').append('svg');
    toolTipSvg
      .attr('height', toolTipHeight)
      .attr('width', tooltipWidth)
      .attr('viewBox', `${tooltipWidth / 2} ${toolTipHeight / 2} ${tooltipWidth} ${toolTipHeight}`)
      .style('border', 'solid')
      .attr('preserveAspectRatio', 'xMinYMid');
    // Tool tip links
    const toolTipLinks = this.createGraphLinks(toolTipSvg, linksFilter);

    // Tooltip Nodes
    const toolTipNodes = this.createGraphNodes(toolTipSvg, nodesFilter);
    // Tooltip Arcs
    this.createNodeArcs(toolTipNodes, 'id');

    toolTipNodes.select(`circle.id${id}`).style('fill', '#12d');

    this.graphUpdate(toolTipSimulation, toolTipLinks, toolTipNodes);
  }
  toggleLinkStrength(): void {
    this.graphLinks.style('stroke-width', (linkData: any) =>
      this.showLinkStrength ? this.linkWidthScale(linkData.tags.length) : '1',
    );
  }
}
