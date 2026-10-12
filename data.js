// Edit this file to update the site. Replace placeholder LinkedIn data when available.
export const profile = {
  name: 'Harsh Chaurasiya',
  location: 'Bangalore, India',
  github: 'https://github.com/harsh6768',
  linkedin: 'https://www.linkedin.com/in/harsh6768/',
  about:
    'Backend developer and DevOps engineer based in Bangalore, currently at PhonePe. I build REST and event-driven APIs, payment and ride-booking flows, and the infrastructure that ships them: AWS, Docker, CI/CD and Kubernetes.',
};

// Source: LinkedIn experience and education sections.
export const experience = [
  {
    role: 'Software Engineer', company: 'PhonePe', period: 'Apr 2022 – Present · Bangalore',
    points: [],
    skills: 'Dropwizard, Java and +5 skills',
  },
  {
    role: 'Software Engineer', company: 'EWar Games', period: 'Mar 2021 – Apr 2022 · Bangalore',
    points: [
      'Designed and implemented backend architecture for the KYC module.',
      'Developed the Daily Leaderboard feature for real-time ranking and reward distribution.',
      'Designed and implemented the Affiliate Program for referral-based user acquisition.',
      'Built a WebSocket-based game server for the 7 Up 7 Down multiplayer game, enabling real-time communication.',
      'Collaborated with cross-functional teams to deliver scalable backend features and production enhancements.',
    ],
    skills: 'JavaScript, Node.js and +3 skills',
  },
  {
    role: 'Software Engineer', company: 'True Tech Professionals', period: 'Jun 2020 – Mar 2021 · Panchkula, India',
    points: [
      'Developed REST APIs and backend services for Island Point using Node.js and Express.js.',
      'Built frontend components using React.js for business workflows.',
      'Contributed to Reka by integrating ML-based word recommendations to improve communication accessibility.',
      'Worked closely with stakeholders to deliver production-ready features.',
    ],
    skills: 'Node.js, AWS and +5 skills',
  },
  {
    role: 'Intern, Backend Developer', company: 'JungleWorks', period: 'Jun 2019 – Jun 2020 · Chandigarh, India',
    points: [],
    skills: 'Node.js, AWS and +2 skills',
  },
  {
    role: 'Freelance Graphic Designer', company: 'Self-paced', period: 'Oct 2016 – Jan 2020',
    points: [],
    skills: '',
  },
];

export const education = [
  { school: 'Lovely Professional University', degree: 'Bachelor of Technology, Computer Engineering', period: '2016 – 2020', detail: '' },
  { school: 'Allen Career Institute', degree: 'IIT Coaching · Kota, Rajasthan', period: '2015 – 2016', detail: '' },
  { school: 'Govt. Excellence Higher Secondary School', degree: '12th, Mathematics · Satna, Madhya Pradesh', period: '2014 – 2015', detail: 'District Chess Player' },
  { school: 'Govt. Excellence Higher Secondary School', degree: '10th, High school · Satna, Madhya Pradesh', period: '2012 – 2013', detail: '' },
];

export const projects = [
  { name: 'E-commerce', lang: 'Flutter', stars: 33, desc: 'Flutter e-commerce app with carousels and reusable components.', url: 'https://github.com/harsh6768/E-commerce' },
  { name: 'awesome-stripe', lang: 'JavaScript', stars: 7, desc: 'Cab-ride payments flow: moving funds to merchant accounts with Stripe.', url: 'https://github.com/harsh6768/awesome-stripe' },
  { name: 'web3-basics', lang: 'JavaScript', stars: 5, desc: 'Web3.js primer for connecting to the Ethereum blockchain.', url: 'https://github.com/harsh6768/web3-basics' },
  { name: 'ecr-deploy', lang: 'JavaScript', stars: 0, desc: 'Node service on RDS deployed as a Docker image to EC2 with CI/CD and ECR.', url: 'https://github.com/harsh6768/ecr-deploy' },
  { name: 'DevTools', lang: 'React / Vite', live: 'https://yourtoolkit.in', desc: '63 fast, browser-local utilities for JSON, encoding, HTTP, SEO, images and PDFs. No sign-up, and nothing leaves your machine.', url: 'https://github.com/harsh6768/your-dev-tool' },
];

export const skills = [
  'Node.js', 'JavaScript', 'Java', 'Python', 'Dart / Flutter', 'Dropwizard', 'Express', 'Fastify',
  'MongoDB', 'MySQL', 'Aerospike', 'Kafka', 'AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Grafana', 'Stripe', 'GraphQL',
];
