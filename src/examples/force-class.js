import * as d3 from 'd3';
// { tooltip }
import chartFactory from '../helpers/common';
import { data2 } from '../../data/stub-data';
import sherlaimovData from '../../data/rootNode.json';
import { getFriends, getFollowers } from '../dataHandler';

const colors = d3.scaleOrdinal(d3.schemeDark2);

class ForceGraph {
  constructor(chartId) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const { svg, container } = chartFactory({ id: chartId });
    this.svg = svg;
    this.container = container;
    this.init();
  }

  init() {
    this.svg
      .call(
        d3.zoom().on('zoom', () => {
          this.container.attr('transform', d3.event.transform);
        })
      )
      .on('dblclick.zoom', null);

    this.link = this.container.selectAll('.link');
    this.node = this.container.selectAll('.node');

    this.tooltip = d3
      .select('body')
      .append('div')
      .classed('tooltip', true)
      .style('opacity', 0); // start invisible

    this.simulation = d3
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
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));
    // .alphaTarget(1);

    this.simulation.on('end', () => {
      console.log('end event');
    });
  }

  appendNodes(d, i) {
    const currNode = d3.select(this);
    currNode
      .append('circle')
      // .transition(t)
      // .attr('class', () => d.screen_name)
      .attr('r', () => d.followers_count / 100)
      .style('fill', () => colors(i));

    currNode
      .append('text')
      .text(() => d.screen_name)
      .attr('text-anchor', 'middle')
      .attr('y', 5);
  }

  buildGraph(data) {
    const { nodes, links } = data;
    const t = d3.transition().duration(1000);

    this.link = this.link.data(links);
    this.link.exit().remove();
    this.link = this.link
      .enter()
      .append('line')
      .attr('class', 'link')
      .merge(this.link);

    this.node = this.node.data(nodes, d => d.id);
    // .style('fill', '#b26745')
    // .transition(t)
    // .attr('r', 0)
    this.node.exit().remove();

    this.simulation.nodes(nodes);

    const nodeEnter = this.node
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('class', d => d.screen_name)
      .each(this.appendNodes);

    this.node = nodeEnter.merge(this.node);

    this.node.on('dblclick', this.releaseNode);
    this.node.call(
      d3
        .drag()
        .on('start', this.dragStarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragEnded.bind(this))
    );

    // node.call(tooltip(d => d.screen_name, container));
    this.node.on('mouseover', d => this.showTooltip(d));
    this.node.on('mouseleave', d => this.hideTooltip(d));

    this.simulation.on('tick', this.ticked.bind(this));
    this.simulation.force('link').links(links);
    this.simulation.alpha(1).restart();
  }

  ticked() {
    this.link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    // node.attr('cx', d => d.x).attr('cy', d => d.y);
    // since now we are dealing with the g SVG element
    this.node.attr('transform', d => `translate(${d.x}, ${d.y})`);
  }

  showTooltip(d) {
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
    this.tooltip
      .html(htmlContent)
      .style('left', `${d3.event.pageX - d3.select('.tooltip').node().offsetWidth - 5}px`)
      .style('top', `${d3.event.pageY - d3.select('.tooltip').node().offsetHeight}px`);
    this.tooltip
      .transition()
      .duration(300)
      .style('opacity', 1); // show the tooltip
  }

  hideTooltip() {
    this.tooltip
      .transition()
      .duration(200)
      .style('opacity', 0);
  }

  dragStarted(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
    // d.fixed = true;
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragEnded(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    // not setting these values to null keeps node where you left it
    // d.fx = null;
    // d.fy = null;
  }

  releaseNode(d) {
    d.fx = null;
    d.fy = null;
  }
}

const select = document.querySelector('select');
let selectedValue = select[select.selectedIndex].value;
select.addEventListener('change', e => {
  selectedValue = e.currentTarget.value;
  prepareGraphData();
});

const getRootNodeData = () => sherlaimovData;

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
const graph = new ForceGraph('force-graph');
async function prepareGraphData() {
  const nodes = await getNodeData();
  const filteredNodes = nodes.filter((node, i) => i < 100);
  const rootNode = getRootNodeData();
  filteredNodes.push(rootNode);
  const links = filteredNodes.map(({ id }) => ({ target: id, source: 'sherlaimov' }));
  console.log(`Incoming nodes total => ${filteredNodes.length}`);
  graph.buildGraph({ nodes: filteredNodes, links });
}
prepareGraphData();
