import * as d3 from 'd3';
import multiSelect from 'd3-selection-multi';
import chartFactory from './helpers/common';

const width = 960;
const height = 600;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

const svg = d3
  .select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

let node;
let link;

svg
  .append('defs')
  .append('marker')
  .attrs({
    id: 'arrowhead',
    viewBox: '-0 -5 10 10',
    refX: 13,
    refY: 0,
    orient: 'auto',
    markerWidth: 13,
    markerHeight: 13,
    xoverflow: 'visible'
  })
  .append('svg:path')
  .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
  .attr('fill', '#999')
  .style('stroke', 'none');

const simulation = d3
  .forceSimulation()
  .force(
    'link',
    d3
      .forceLink()
      .id((d) => d.id)
      .distance(100)
    // .strength()
  )
  .force(
    'charge',
    d3.forceManyBody(-400)
    // .strength(-1000)
    // .distanceMax(150)
  )
  .force('center', d3.forceCenter(width / 2, height / 2));
/*
				many-body force (force applied amongst all nodes, negative strength for repulsion):
				.force("charge", d3.forceManyBody().strength(-40).distanceMax(150))
				centering force (mean position of all nodes):
				.force("center", d3.forceCenter(chartWidth / 2, chartHeight / 2)) 
				// link force (pushes linked nodes together or apart according to the desired link distance):
				.force("link", d3.forceLink())
				// prevent nodes from ovelapping, treating them as circles with the given radius:
				.force("collide", d3.forceCollide((nodeWidth + 2) / 2))
*/

d3.json('./data/graph.json')
  .then(graph => {
    update(graph.links, graph.nodes);
  })
  .catch(e => console.log(e));

const tooltip = d3
  .select('body')
  .append('div')
  .classed('tooltip', true)
  .style('opacity', 0); // start invisible
function update(links, nodes) {
  console.log(links);
  link = svg
    .selectAll('.link')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('marker-end', 'url(#arrowhead)');

  link.append('title').text((d) => d.type);

  const edgepaths = svg
    .selectAll('.edgepath')
    .data(links)
    .enter()
    .append('path')
    .attrs({
      class: 'edgepath',
      'fill-opacity': 0,
      'stroke-opacity': 0,
      id(d, i) {
        return `edgepath${  i}`;
      }
    })
    .style('pointer-events', 'none');

  const edgelabels = svg
    .selectAll('.edgelabel')
    .data(links)
    .enter()
    .append('text')
    .style('pointer-events', 'none')
    .attrs({
      class: 'edgelabel',
      id(d, i) {
        return `edgelabel${  i}`;
      },
      'font-size': 10,
      fill: '#aaa'
    });

  edgelabels
    .append('textPath')
    .attr('xlink:href', (d, i) => `#edgepath${  i}`)
    .style('text-anchor', 'middle')
    .style('pointer-events', 'none')
    .attr('startOffset', '50%')
    .text((d) => d.type);

  node = svg
    .selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .call(
      d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
      // .on("end", dragended)
    );

  node
    .append('circle')
    .attr('r', 5)
    .style('fill', (d, i) => colors(i));

  node.append('title').text((d) => d.id);

  node
    .append('text')
    .attr('dy', -3)
    .text((d) => `${d.name  }:${  d.label}`);

  node
    .on('mouseover', (d) => {
      tooltip
        .transition()
        .duration(300)
        .style('opacity', 1); // show the tooltip
      tooltip
        .html(d.name)
        .style('left', `${d3.event.pageX - d3.select('.tooltip').node().offsetWidth - 5  }px`)
        .style('top', `${d3.event.pageY - d3.select('.tooltip').node().offsetHeight  }px`);
    })
    .on('mouseleave', (d) => {
      tooltip
        .transition()
        .duration(200)
        .style('opacity', 0);
    });
  simulation.nodes(nodes).on('tick', ticked);

  simulation.force('link').links(links);
  function ticked() {
    // console.log('tick');
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node.attr('transform', (d) => `translate(${  d.x  }, ${  d.y  })`);

    edgepaths.attr('d', (d) => `M ${  d.source.x  } ${  d.source.y  } L ${  d.target.x  } ${  d.target.y}`);

    edgelabels.attr('transform', function(d) {
      if (d.target.x < d.source.x) {
        const bbox = this.getBBox();

        const rx = bbox.x + bbox.width / 2;
        const ry = bbox.y + bbox.height / 2;
        return `rotate(180 ${  rx  } ${  ry  })`;
      } 
        return 'rotate(0)';
      
    });
  }
}

// tooltip div:

function dragstarted(d) {
  console.log('drag started');
  console.log(d);
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  console.log('dragged');
  // d.fixed = true;
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}
