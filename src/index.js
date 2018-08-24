import * as d3 from 'd3';
import chartFactory, { tooltip } from './helpers/common';
import { data2 } from '../data/stub-data';
import getFriends from './dataHandler';

async function getData() {
  const data = await getFriends();
  const mutualNodes = data.nodes
    .filter(({ screen_name }) => screen_name !== 'sherlaimov')
    .filter(({ relations }) => relations.includes('following') && relations.includes('followed_by'))
    .filter((item, id) => id <= 20);
  const parentNode = data.nodes.find(user => user.screen_name === 'sherlaimov');
  const links = mutualNodes.map(({ id }) => ({ target: id, source: 'sherlaimov' }));
  links.push({ target: 'sherlaimov', source: 'sherlaimov' });
  mutualNodes.push(parentNode);

  buildGraph({ nodes: mutualNodes, links });
}
getData();

const width = 900;
const height = 600;
const radius = 20;

const colors = d3.scaleOrdinal(d3.schemeDark2);

const { svg, container } = chartFactory();

svg
  .call(
    d3.zoom().on('zoom', () => {
      container.attr('transform', d3.event.transform);
    })
  )
  .on('dblclick.zoom', null);

const simulation = d3
  .forceSimulation()
  .force(
    'link',
    d3.forceLink().id(d => {
      return d.id;
    })
    // .distance(function(d) {
    //   console.log(d);
    //   return d.source.id;
    // })
    // .strength(0.5)
  )
  .force('charge', d3.forceManyBody().strength(-500))
  .force('center', d3.forceCenter(width / 2, height / 2));

let link = container.selectAll('.link');
let node = container.selectAll('.node');

function buildGraph(data) {
  const { nodes, links } = data;

  simulation.nodes(nodes).on('tick', ticked);
  simulation.force('link').links(links);

  link = link
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'link');

  node = node
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node');

  node
    .append('circle')
    .attr('r', d => d.followers_count / 100)
    .attr('stroke-width', d => Math.sqrt(d.x))
    .style('fill', (d, i) => {
      return colors(i);
    });

  node.on('dblclick', releaseNode);

  node.call(
    d3
      .drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
  );

  node.append('text').text(d => d.screen_name);

  node.call(tooltip(d => d.screen_name, container));

  function ticked(e) {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    // node.attr('cx', d => d.x).attr('cy', d => d.y);
    node.attr('transform', function(d) {
      return 'translate(' + d.x + ', ' + d.y + ')';
    });
  }
}

simulation.on('end', () => {
  console.log('end event');
});

function dragStarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  // d.fixed = true;
  // d.fx = d.x;
  // d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragEnded(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  // d.fx = null;
  // d.fy = null;
}
function releaseNode(d) {
  d.fx = null;
  d.fy = null;
}
