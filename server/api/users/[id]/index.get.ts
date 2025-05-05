import { defineEventHandler, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    return createError({
      statusCode: 400,
      message: 'User ID is required'
    });
  }

  // In a production environment, you would fetch this from a database
  // For now, we're using hardcoded data for demonstration
  const users = [
    {
      id: 'mb001',
      name: 'Madhushika Bandara',
      email: 'mbandara@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'kd001',
      name: 'Kasun Dissanayaka',
      email: 'kdissanayaka@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'sa001',
      name: 'Susith Alwis',
      email: 'SAlwis@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'sk001',
      name: 'Sajith Kumara',
      email: 'skumara@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'pds001',
      name: 'Pasindu De Silva',
      email: 'PDeSilva@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'pa001',
      name: 'Pathum Addarapathirana',
      email: 'paddarapathirana@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'rp001',
      name: 'Rusiru Pallawala',
      email: 'rpallawala@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'ga001',
      name: 'Gishan Abeysinghe',
      email: 'gabeysinghe@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'nt001',
      name: 'Nipuna Theekshana',
      email: 'ntheekshana@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'ki001',
      name: 'Kumal Illankoon',
      email: 'killankoon@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'gp001',
      name: 'Gopinath Pakeerathan',
      email: 'gpakeerathan@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'hr001',
      name: 'Heshadee Ranasinghe',
      email: 'hranasinghe@Coveragex.com',
      role: 'Business Analyst',
      avatar: null
    },
    {
      id: 'rs001',
      name: 'Rishmi Samaradiwakara',
      email: 'RSamaradiwakara@Coveragex.com',
      role: 'HR',
      avatar: null
    },
    {
      id: 'pc001',
      name: 'Pahan Chathuranga',
      email: 'pchathuranga@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'ns001',
      name: 'Nethupama Shavinda',
      email: 'nshavinda@Coveragex.com',
      role: 'Developer',
      avatar: null
    },
    {
      id: 'sar001',
      name: 'Sajith Ariyarathna',
      email: 'sariyarathna@Coveragex.com',
      role: 'Developer',
      avatar: null
    }
  ];

  const user = users.find(user => user.id === id);

  if (!user) {
    return createError({
      statusCode: 404,
      message: `User with ID ${id} not found`
    });
  }

  return user;
});