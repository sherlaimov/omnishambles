import * as d3 from 'd3';
// { tooltip }
import chartFactory from './helpers/common';
import { data2 } from '../data/stub-data';
import sherlaimovData from '../data/rootNode.json';
import { getFriends, getFollowers } from './dataHandler';

const width = window.innerWidth;
const height = window.innerHeight;

const colors = d3.scaleOrdinal(d3.schemeDark2);

const { svg, container } = chartFactory();

const tooltip = d3
  .select('body')
  .append('div')
  .classed('tooltip', true)
  .style('opacity', 0); // start invisible

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
    d3
      .forceLink()
      .id(d => d.id)
      .distance(d => d.target.followers_count / 50)
      .strength(0.2)
  )
  .force('charge', d3.forceManyBody().strength(-500))
  .force('center', d3.forceCenter(width / 2, height / 2));
// .alphaTarget(1);

let link = container.selectAll('.link');
let node = container.selectAll('.node');

function buildGraph(data) {
  const { nodes, links } = data;
  const t = d3.transition().duration(1000);

  link = link.data(links);
  link.exit().remove();
  link = link
    .enter()
    .append('line')
    .attr('class', 'link')
    .merge(link);

  function appendNodes(d, i) {
    const currNode = d3.select(this);
    currNode
      .append('circle')
      // .transition(t)
      .attr('class', () => d.screen_name)
      .attr('r', () => d.followers_count / 100)
      .style('fill', () => colors(i));

    currNode
      .append('text')
      .text(() => d.screen_name)
      .attr('text-anchor', 'middle')
      .attr('y', 5);
  }
  node = node.data(nodes, d => d.id);
  // .style('fill', '#b26745')
  // .transition(t)
  // .attr('r', 0)
  node.exit().remove();

  simulation.nodes(nodes).on('tick', ticked);

  node = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .each(appendNodes)
    .merge(node);

  node.on('dblclick', releaseNode);
  node.call(
    d3
      .drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
  );

  // node.call(tooltip(d => d.screen_name, container));
  node.on('mouseover', d => showTooltip(d));
  node.on('mouseleave', d => hideTooltip(d));

  simulation.force('link').links(links);
  simulation.alpha(1).restart();

  function ticked() {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    // node.attr('cx', d => d.x).attr('cy', d => d.y);
    // since now we are dealing with the g SVG element
    node.attr('transform', d => `translate(${d.x}, ${d.y})`);
  }
}

function showTooltip(d) {
  const {
    screen_name,
    description,
    followers_count,
    friends_count,
    location,
    statuses_count,
    ranking,
    verified
  } = d;
  const htmlContent = [
    `<p>Name: ${screen_name}</p>`,
    `<p class="description">${description}</p>`,
    `<p>Followers: ${followers_count}</p>`,
    `<p>Following: ${friends_count}</p>`,
    `<p>Location: ${location}</p>`,
    `<p>Tweets total: ${statuses_count}</p>`
  ].join('');
  tooltip
    .html(htmlContent)
    .style('left', `${d3.event.pageX - d3.select('.tooltip').node().offsetWidth - 5}px`)
    .style('top', `${d3.event.pageY - d3.select('.tooltip').node().offsetHeight}px`);
  tooltip
    .transition()
    .duration(300)
    .style('opacity', 1); // show the tooltip
}
function hideTooltip() {
  tooltip
    .transition()
    .duration(200)
    .style('opacity', 0);
}
simulation.on('end', () => {
  console.log('end event');
});

function dragStarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  // d.fixed = true;
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragEnded(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  // not setting these values to null keeps node where you left it
  // d.fx = null;
  // d.fy = null;
}
function releaseNode(d) {
  d.fx = null;
  d.fy = null;
}

const select = document.querySelector('select');
let selectedValue = select[select.selectedIndex].value;
select.addEventListener('change', e => {
  selectedValue = e.currentTarget.value;
  prepareGraphData();
});

const getParentNodeData = () => sherlaimovData;

async function getNodeData() {
  const friends = await getFriends();
  const followers = await getFollowers();
  switch (selectedValue) {
    case 'all_friends':
      console.log('all_friends');
      return friends;
    case 'all_followers':
      console.log('all_followers');
      return followers;
    case 'mutual_following':
      console.log('mutual_following');
      return friends.filter(friend =>
        followers.find(follower => friend.screen_name === follower.screen_name)
      );
    case 'exclusive_followers':
      return followers.filter(follower =>
        friends.every(friend => friend.screen_name !== follower.screen_name)
      );
    case 'exclusive_friends':
      return friends.filter(friend =>
        followers.every(follower => follower.screen_name !== friend.screen_name)
      );
    default:
      return friends;
  }
}

async function prepareGraphData() {
  const nodes = await getNodeData();
  const parentNode = getParentNodeData();
  nodes.push(parentNode);
  const links = nodes.map(({ id }) => ({ target: id, source: 'sherlaimov' }));
  buildGraph({ nodes, links });
}
prepareGraphData();
