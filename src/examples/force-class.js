import * as d3 from 'd3';
// { tooltip }
import chartFactory from '../helpers/common';
import { data2 } from '../../data/stub-data';
import sherlaimovData from '../../data/rootNode.json';
import { getFriends, getFollowers } from '../dataHandler';

const colors = d3.scaleOrdinal(d3.schemeDark2);
window.d3 = d3;
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
    this.zoom = d3.zoom().on('zoom', () => {
      this.container.attr('transform', d3.event.transform);
    });

    this.zoom(this.svg);
    this.svg.on('dblclick.zoom', null);

    this.link = this.container.append('g').selectAll('.link');
    this.node = this.container.selectAll('.node');

    this.tooltip = d3
      .select('body')
      .append('div')
      .classed('tooltip', true)
      .style('opacity', 0); // start invisible
    // TODO
    // https://github.com/ericsoco/d3-force-attract
    this.simulation = d3
      .forceSimulation()
      .force(
        'link',
        d3
          .forceLink()
          .id(d => d.id)
          .distance(d => rScale(d.target.followers_count) * 2)
          .strength(0.2)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));
    // .force('bounds', this.boxingForce.bind(this));
    // .force("collide", d3.forceCollide(50))
    // // .force('x', d3.forceX(this.width / 2));
    // .force(
    //   'collide',
    //   d3.forceCollide((d) => d.target.followers_count / 100)
    // );
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
      .attr('r', () => rScale(d.followers_count))
      // .attr('r', () => d.followers_count / 100)
      .style('fill', () => colors(i));

    currNode
      .append('text')
      .text(() => d.screen_name)
      // Automatic Text Sizing
      .style('font-size', function() {
        const textWidth = this.getComputedTextLength();
        const parentWidth = this.parentNode.getBBox().width;
        let scale = 16;
        scale = ((parentWidth - 30) / textWidth) * 16;
        if (scale < 16) scale = 16;
        return `${scale}px`;
      })
      .attr('text-anchor', 'middle')
      .attr('y', 5);
  }

  buildGraph(data) {
    const { nodes, links } = data;
    const t = d3.transition().duration(1000);
    const that = this;

    this.rScale = d3
      .scaleSqrt()
      .domain([0, d3.max(nodes, d => d.friends_count)])
      .range([1, 50]);
    window.rScale = this.rScale;

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

    const nodeEnter = this.node
      .enter()
      .append('g')
      .attr('class', d => `node ${d.screen_name}`)
      .each(this.appendNodes);

    this.node = nodeEnter.merge(this.node);
    const rootNode = this.node.filter(node => node.screen_name === 'sherlaimov');
    window.root = rootNode;

    this.node.on('dblclick', this.releaseNode);
    this.node.call(
      d3
        .drag()
        .on('start', function(d) {
          ForceGraph.dragStarted(d, that.simulation, this);
        })
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragEnded.bind(this))
    );

    // node.call(tooltip(d => d.screen_name, container));
    this.node.on('mouseover', d => this.showTooltip(d));
    this.node.on('mouseleave', d => this.hideTooltip(d));
    // this.node.on('dblclick.zoom', this.center.bind(this));
    this.simulation.on('tick', this.ticked.bind(this));
    this.simulation.nodes(nodes);
    this.simulation.force('link').links(links);
    // this.zoom.translateTo(this.svg, this.width / 2, this.height / 2);
    this.simulation.alphaTarget(0.3).restart();
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

  boxingForce() {
    this.node.attr('transform', d => {
      // console.log(d);
      d.x = Math.max(d.friends_count / 100, Math.min(this.width - d.friends_count / 100, d.x));
      d.y = Math.max(d.friends_count / 100, Math.min(this.height - d.friends_count / 100, d.y));
      return `translate(${d.x}, ${d.y})`;
    });
  }

  center(d) {
    d3.event.stopPropagation();
    console.log(d);
    console.log(this.zoom.translateTo(this.svg, d.x, d.y));
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

  static dragStarted(d, simulation, node) {
    d3.select(node).raise();
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
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
  const filteredNodes = nodes.filter((node, i) => i < 200);
  const rootNode = getRootNodeData();
  filteredNodes.push(rootNode);
  const links = filteredNodes.map(({ id }) => ({ target: id, source: 'sherlaimov' }));
  console.log(`Incoming nodes total => ${nodes.length}`);
  graph.buildGraph({ nodes: filteredNodes, links });
}
prepareGraphData();
