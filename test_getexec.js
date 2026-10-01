const agents = [
  { name: 'Alice CEO', role: 'CEO' },
  { name: 'Bob', role: 'ceo' },
  { name: 'Eve', role: 'Chief Executive' }
];
const getExec = (r) => agents.find((a) => (a.role && a.role.toUpperCase() === r.replace("AI ", "")) || (a.name && a.name.toUpperCase().includes(r.replace("AI ", ""))));

console.log('AI CEO:', getExec('AI CEO'));
