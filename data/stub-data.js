const nodes1 = [
  { x: 208.992345, y: 273.053211, id: 1, radius: 3 },
  { x: 595.98896, y: 56.377057, id: 2, radius: 1 },
  { x: 319.568434, y: 278.523637, id: 3, radius: 2 },
  { x: 214.494264, y: 214.893585, id: 4, radius: 1 },
  { x: 482.664139, y: 340.386773, id: 5, radius: 2 },
  { x: 283.630624, y: 87.898162, id: 0, radius: 3 },
];
// const links = [{ source: 0, target: 1, distance: 10 }];
const links1 = [
  { target: 1, source: 0 },
  { target: 2, source: 1 },
  { target: 3, source: 2 },
  { target: 4, source: 2 },
  { target: 5, source: 0 },
];

export const data1 = {
  links: links1,
  nodes: nodes1,
};
const nodes2 = [
  { id: 'zindelzindel' },
  { id: 'DeveloperDonTV' },
  { id: 'chisoftware' },
  { id: 'thewastedworld' },
  { id: 'Araptan' },
  { id: 'sherlaimov' },
];
const links2 = [
  { target: 'zindelzindel', source: 'sherlaimov' },
  { target: 'DeveloperDonTV', source: 'sherlaimov' },
  { target: 'chisoftware', source: 'sherlaimov' },
  { target: 'thewastedworld', source: 'sherlaimov' },
  { target: 'Araptan', source: 'sherlaimov' },
  { target: 'sherlaimov', source: 'sherlaimov' },
];

export const data2 = {
  links: links2,
  nodes: nodes2,
};

const nodes3 = [{ id: 'Harry' }, { id: 'Sally' }, { id: 'Alice' }];
const links3 = [{ source: 'Harry', target: 'Sally' }, { source: 'Harry', target: 'Alice' }];
export const data3 = {
  links: links3,
  nodes: nodes3,
};
