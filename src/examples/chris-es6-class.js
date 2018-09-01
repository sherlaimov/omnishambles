import * as d3 from 'd3';

/*
EXAMPLE URL
https://bl.ocks.org/christianbriggs/c6f283457fc9abb2b88b3393e73d90f0
*/

class D3ForceGraph {
  constructor(graphDiv, svgId) {
    const t = this;

    t.graphDiv = graphDiv;
    console.log(graphDiv.scrollWidth);
    t.rect = t.graphDiv.getBoundingClientRect();
    t.width = t.graphDiv.scrollWidth;
    t.height = window.innerHeight;
    t.center = { x: t.width / 2, y: t.height / 2 };

    t.svgId = svgId;
    t.updateRefCount = 0;
  }

  init() {
    const t = this;

    t.graphData = { nodes: [], links: [] };

    // graph area
    const svg = d3
      .select(t.graphDiv)
      .append('svg')
      .attr('id', t.svgId)
      .attr('width', t.width)
      .attr('height', t.height);

    // Needs to be second, just after the svg itself.
    const background = t.initBackground(t, svg);
    // background

    // Holds child components (nodes, links), i.e. all but the background
    const svgGroup = svg.append('svg:g').attr('id', 'svgGroup');
    t.svgGroup = svgGroup;

    const graphLinksGroup = svgGroup
      .append('g')
      .attr('id', `links_${t.svgId}`)
      .attr('class', 'links');
    t.graphLinksGroup = graphLinksGroup;

    const graphNodesGroup = svgGroup
      .append('g')
      .attr('id', `nodes_${t.svgId}`)
      .attr('class', 'nodes');
    t.graphNodesGroup = graphNodesGroup;

    const zoom = d3.zoom().on('zoom', () => t.handleZoom(svgGroup));
    background.call(zoom);

    const simulation = t.initSimulation();
    t.simulation = simulation;

    // update();
    t.update(t, simulation, graphNodesGroup, graphLinksGroup);
  }

  initBackground(t, svg) {
    const result = svg
      .append('rect')
      .attr('id', 'backgroundId')
      // .attr('fill', '#F2F7F0')
      .attr('class', 'view')
      .attr('x', 0.5)
      .attr('y', 0.5)
      .attr('width', t.width - 1)
      .attr('height', t.height - 1)
      .on('click', () => t.handleBackgroundClicked());

    return result;
  }

  initSimulation() {
    const t = this;

    const result = d3
      .forceSimulation()
      .velocityDecay(0.55)
      .force(
        'link',
        d3
          .forceLink()
          .distance(100)
          .id(d => d.id)
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          .strength(-100)
          .distanceMin(10000)
      )
      .force('collide', d3.forceCollide(25))
      .force('center', d3.forceCenter(t.center.x, t.center.y));

    return result;
  }

  getRadius(d) {
    const min = 5;
    const max = 50;
    let r = Math.trunc(500 / (d.id || 1));
    if (r < min) r = min;
    if (r > max) r = max;

    return r;
  }

  getColor(d) {
    return 'lightblue';
  }

  handleDragStarted(d, simulation) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  }

  handleDragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  handleDragEnded(d, simulation) {
    if (!d3.event.active) simulation.alphaTarget(0);

    d.fx = undefined;
    d.fy = undefined;
  }

  handleBackgroundClicked() {
    console.log(`background clicked in numero 2`);
  }

  handleZoom(svgGroup) {
    svgGroup.attr(
      'transform',
      `translate(${d3.event.transform.x}, ${d3.event.transform.y})` +
        ' ' +
        `scale(${d3.event.transform.k})`
    );
  }

  update(t, simulation, graphNodesGroup, graphLinksGroup) {
    const nodes = t.graphData.nodes;
    const links = t.graphData.links;

    const drag = d3
      .drag()
      .on('start', d => t.handleDragStarted(d, simulation))
      .on('drag', d => t.handleDragged(d))
      .on('end', d => t.handleDragEnded(d, simulation));

    // nodes
    let graphNodesData = graphNodesGroup.selectAll('g').data(nodes, d => d.id);
    const graphNodesEnter = graphNodesData
      .enter()
      .append('g')
      .attr('id', d => d.id || null)
      .on('contextmenu', (d, i) => {
        t.remove(d);
        d3.event.preventDefault();
      })
      .on('mouseover', d => console.log(`d.id: ${d.id}`))
      .on('click', d => t.handleNodeClicked(d))
      .call(drag);
    const graphNodesExit = graphNodesData
      .exit()
      // .call((s) => console.log(`selection exiting. s: ${JSON.stringify(s)}`))
      .remove();

    const graphNodeCircles = graphNodesEnter
      .append('circle')
      .classed('node', true)
      .attr('cursor', 'pointer')
      .attr('r', d => t.getRadius(d))
      .attr('fill', d => t.getColor(d));

    const graphNodeLabels = graphNodesEnter
      .append('text')
      .attr('id', d => `label_${d.id}`)
      .attr('font-size', `10px`)
      .attr('text-anchor', 'middle')
      .text(d => `${d.id}`);

    // merge
    graphNodesData = graphNodesEnter.merge(graphNodesData);

    // links
    let graphLinksData = graphLinksGroup.selectAll('line').data(links);
    const graphLinksEnter = graphLinksData.enter().append('line');
    const graphLinksExit = graphLinksData.exit().remove();
    // merge
    graphLinksData = graphLinksEnter.merge(graphLinksData);

    simulation
      .nodes(nodes)
      .on('tick', handleTicked)
      .on('end', () => t.handleEnd());

    simulation.force('link').links(links);

    function handleTicked() {
      graphLinksData
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      // Translate the groups
      graphNodesData.attr('transform', d => `translate(${[d.x, d.y]})`);
    }
  }

  add(nodesToAdd, linksToAdd) {
    const t = this;

    if (nodesToAdd) {
      nodesToAdd.forEach(n => t.graphData.nodes.push(n));
    }
    if (linksToAdd) {
      linksToAdd.forEach(l => t.graphData.links.push(l));
    }

    // update();
    t.update(t, t.simulation, t.graphNodesGroup, t.graphLinksGroup);
    t.simulation.restart();
    t.simulation.alpha(1);
  }

  remove(dToRemove) {
    console.log(`dToRemove: ${JSON.stringify(dToRemove)}`);

    const t = this;

    const currentNodes = t.graphData.nodes;
    const currentLinks = t.graphData.links;
    const nIndex = currentNodes.indexOf(dToRemove);
    if (nIndex > -1) {
      currentNodes.splice(nIndex, 1);
    }

    const toRemoveLinks = currentLinks.filter(
      l => l.source.id === dToRemove.id || l.target.id === dToRemove.id
    );
    toRemoveLinks.forEach(l => {
      const lIndex = currentLinks.indexOf(l);
      currentLinks.splice(lIndex, 1);
    });

    t.update(t, t.simulation, t.graphNodesGroup, t.graphLinksGroup);
    t.simulation.restart();
    t.simulation.alpha(1);
  }

  handleNodeClicked(d) {
    console.log(`node clicked: ${JSON.stringify(d)}`);

    const t = this;

    const newId = Math.trunc(Math.random() * 1000);
    const newNode = { id: newId, name: 'server 22', x: d.x, y: d.y };
    const newNodes = [newNode];
    const newLinks = [{ source: d.id, target: newNode.id }];

    t.add(newNodes, newLinks);
  }

  handleEnd() {
    console.log('end yo');
  }
}

// const graphDiv = document.querySelector('#ib-d3-graph-div');
const graphDiv = document.createElement('div');
graphDiv.id = '#d3-graph';
document.body.append(graphDiv);
const graph = new D3ForceGraph(graphDiv, 'testSvgId');
graph.init();

setTimeout(() => {
  const initialCount = 10;
  const nodes = [{ id: 0, name: 'root node' }];
  const links = [];
  for (let i = 1; i < initialCount; i++) {
    const randomIndex = Math.trunc(Math.random() * nodes.length);
    const randomNode = nodes[randomIndex];
    const newNode = { id: i, name: `node ${i}` };
    const newLink = { source: randomIndex, target: newNode.id };

    nodes.push(newNode);
    links.push(newLink);
  }

  graph.add(nodes, links);

  let count = 0;
  const interval = setInterval(() => {
    const randomIndex = Math.trunc(Math.random() * graph.graphData.nodes.length);
    const randomNode = graph.graphData.nodes[randomIndex];
    const randomId = Math.trunc(Math.random() * 100000);
    const newNode = { id: randomId, name: `server ${randomId}` };
    if (randomNode.x) {
      newNode.x = randomNode.x;
      newNode.y = randomNode.y;
    }
    const newLink = { source: randomNode.id, target: randomId };
    graph.add([newNode], [newLink]);
    count++;
    if (count % 100 === 0) {
      console.log(`count: ${count}`);
      if (count % 200 === 0) {
        clearInterval(interval);
      }
    }
  }, 10);
}, 500);
