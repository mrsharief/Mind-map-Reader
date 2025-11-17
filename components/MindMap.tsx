import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { MindMapData, MindMapNode, MindMapLink as MindMapLinkType } from '../types';

interface MindMapProps {
  data: MindMapData;
  svgRef: React.RefObject<SVGSVGElement>;
}

const NODE_COLORS = ['#bb86fc', '#03dac6', '#cf6679'];

const MindMap: React.FC<MindMapProps> = ({ data, svgRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const nodes = useMemo(() => data.nodes.map(d => ({ ...d })), [data.nodes]);
  const links = useMemo(() => data.links.map(l => ({ ...l })), [data.links]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height).attr('viewBox', [-width / 2, -height / 2, width, height]);

    const g = svg.append('g');

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(0, 0))
      .on('tick', ticked);

    const link = g
      .append('g')
      .attr('stroke', '#a0a0a0')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    // FIX: Moved the 'drag' function declaration before its usage to resolve a block-scoped variable error.
    const drag = (simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) => {
      function dragstarted(event: d3.D3DragEvent<any, any, any>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event: d3.D3DragEvent<any, any, any>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event: d3.D3DragEvent<any, any, any>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    };

    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation) as any);

    node
      .append('circle')
      .attr('r', d => 10 + (2 - d.level) * 5)
      .attr('fill', d => NODE_COLORS[d.level % NODE_COLORS.length])
      .attr('stroke', '#121212')
      .attr('stroke-width', 2);

    node
      .append('text')
      .text(d => d.label)
      .attr('x', 18)
      .attr('y', 5)
      .attr('fill', '#e0e0e0')
      .style('font-size', '16px')
      .style('font-weight', 'bold');

    function ticked() {
      link
        .attr('x1', d => (d.source as MindMapNode).x!)
        .attr('y1', d => (d.source as MindMapNode).y!)
        .attr('x2', d => (d.target as MindMapNode).x!)
        .attr('y2', d => (d.target as MindMapNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    }

  }, [nodes, links, svgRef]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} aria-hidden="true"></svg>
    </div>
  );
};

export default MindMap;