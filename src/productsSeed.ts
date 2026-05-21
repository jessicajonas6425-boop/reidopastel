import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // --- CATEGORY: EMPADAS ---
  {
    id: 'emp-frango-requeijao',
    name: 'Frango c/ Requeijão',
    description: 'Deliciosa massa c/ recheio de frango e requeijão.',
    price: 5.90,
    category: 'EMPADAS',
    available: true
  },
  {
    id: 'emp-calabresa-requeijao',
    name: 'Calabresa c/ Requeijão',
    description: 'Deliciosa massa c/ recheio de calabresa e requeijão.',
    price: 5.90,
    category: 'EMPADAS',
    available: true
  },
  {
    id: 'emp-duplo-queijo',
    name: 'Duplo Queijo',
    description: 'Deliciosa massa com queijo mussarela e requeijão.',
    price: 6.50,
    category: 'EMPADAS',
    available: true
  },
  {
    id: 'emp-brigadeiro-parmesao',
    name: 'Brigadeiro de Parmesão',
    description: 'Deliciosa massa com doce de queijo parmesão.',
    price: 6.50,
    category: 'EMPADAS',
    available: true
  },
  {
    id: 'emp-queijo-alho',
    name: 'Queijo c/ Alho',
    description: 'Deliciosa massa com recheio de queijo muss. c/ alho.',
    price: 5.90,
    category: 'EMPADAS',
    available: true
  },
  {
    id: 'emp-minas-oregano',
    name: 'Minas c/ Orégano',
    description: 'Deliciosa massa com recheio de queijo minas c/ orégano.',
    price: 5.90,
    category: 'EMPADAS',
    available: true
  },

  // --- CATEGORY: EMPADÃO ---
  {
    id: 'empadao-frango-190',
    name: 'Frango c/ Cream Cheese (190 g)',
    description: 'Deliciosa massa com recheio de frango e c. cheese.',
    price: 10.90,
    category: 'EMPADÃO',
    available: true
  },
  {
    id: 'empadao-frango-380',
    name: 'Frango c/ Cream Cheese (380 g)',
    description: 'Deliciosa massa com recheio de frango e c. cheese.',
    price: 18.90,
    category: 'EMPADÃO',
    available: true
  },
  {
    id: 'empadao-frango-750',
    name: 'Frango c/ Cream Cheese (750 g)',
    description: 'Deliciosa massa com recheio de frango e c. cheese.',
    price: 35.90,
    category: 'EMPADÃO',
    available: true
  },
  {
    id: 'empadao-frango-1200',
    name: 'Frango c/ Cream Cheese (1200 g)',
    description: 'Deliciosa massa com recheio de frango e c. cheese.',
    price: 59.90,
    category: 'EMPADÃO',
    available: true
  },
  {
    id: 'empadao-calabresa-190',
    name: 'Calabresa c/ Requeijão (190 g)',
    description: 'Deliciosa massa com recheio de calab. e requeijão.',
    price: 11.90,
    category: 'EMPADÃO',
    available: true
  },
  {
    id: 'empadao-duqueijo-190',
    name: 'Duplo Queijo (190 g)',
    description: 'Deliciosa massa com recheio de queijo e requeijão.',
    price: 11.90,
    category: 'EMPADÃO',
    available: true
  },
  {
    id: 'empadao-romeu-190',
    name: 'Romeu e Julieta (190 g)',
    description: 'Deliciosa massa com recheio de Minas c/ goiabada.',
    price: 10.90,
    category: 'EMPADÃO',
    available: true
  },
  {
    id: 'empadao-doceleite-190',
    name: 'Minas c/ Doce de Leite (190 g)',
    description: 'Deliciosa massa com recheio de Minas c/ D. de Leite.',
    price: 11.90,
    category: 'EMPADÃO',
    available: true
  },
  {
    id: 'empadao-camarao-190',
    name: 'Camarão (190 g)',
    description: 'Deliciosa massa com recheio de Camarão.',
    price: 13.90,
    category: 'EMPADÃO',
    available: true
  },

  // --- CATEGORY: SALGADINHOS (20G) ---
  {
    id: 'salg-aipim-seca-10',
    name: 'Aipim c/ Carne Seca - 10 Unidades',
    description: 'Salgadinho de aipim com recheio cremoso de carne seca.',
    price: 13.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-seca-25',
    name: 'Aipim c/ Carne Seca - 25 Unidades',
    description: 'Salgadinho de aipim com recheio cremoso de carne seca.',
    price: 31.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-seca-50',
    name: 'Aipim c/ Carne Seca - 50 Unidades',
    description: 'Salgadinho de aipim com recheio cremoso de carne seca.',
    price: 55.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-cam-10',
    name: 'Aipim c/ Camarão - 10 Unidades',
    description: 'Salgadinho de aipim com delicioso recheio de camarão.',
    price: 13.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-cam-25',
    name: 'Aipim c/ Camarão - 25 Unidades',
    description: 'Salgadinho de aipim com delicioso recheio de camarão.',
    price: 30.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-cam-50',
    name: 'Aipim c/ Camarão - 50 Unidades',
    description: 'Salgadinho de aipim com delicioso recheio de camarão.',
    price: 53.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-alho-pore-10',
    name: 'Alho Poró c/ Cream Cheese - 10 Unidades',
    description: 'Salgadinho de alho poró com cream cheese genuíno.',
    price: 13.00,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-alho-pore-25',
    name: 'Alho Poró c/ Cream Cheese - 25 Unidades',
    description: 'Salgadinho de alho poró com cream cheese genuíno.',
    price: 28.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-alho-pore-50',
    name: 'Alho Poró c/ Cream Cheese - 50 Unidades',
    description: 'Salgadinho de alho poró com cream cheese genuíno.',
    price: 49.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-provolone-10',
    name: 'Bolinho de Provolone - 10 Unidades',
    description: 'Bolinhos recheados com legítimo queijo provolone.',
    price: 14.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-provolone-25',
    name: 'Bolinho de Provolone - 25 Unidades',
    description: 'Bolinhos recheados com legítimo queijo provolone.',
    price: 32.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-provolone-50',
    name: 'Bolinho de Provolone - 50 Unidades',
    description: 'Bolinhos recheados com legítimo queijo provolone.',
    price: 59.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-queijo-alho-10',
    name: 'Queijo c/ Alho - 10 Unidades',
    description: 'Recheado com queijo derretido e toque de alho.',
    price: 12.00,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-queijo-alho-25',
    name: 'Queijo c/ Alho - 25 Unidades',
    description: 'Recheado com queijo derretido e toque de alho.',
    price: 26.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-queijo-alho-50',
    name: 'Queijo c/ Alho - 50 Unidades',
    description: 'Recheado com queijo derretido e toque de alho.',
    price: 49.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-queijo-azei-10',
    name: 'Queijo c/ Azeitona - 10 Unidades',
    description: 'Combinação de queijo derretido e azeitonas picadas.',
    price: 12.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-queijo-azei-25',
    name: 'Queijo c/ Azeitona - 25 Unidades',
    description: 'Combinação de queijo derretido e azeitonas picadas.',
    price: 27.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-queijo-azei-50',
    name: 'Queijo c/ Azeitona - 50 Unidades',
    description: 'Combinação de queijo derretido e azeitonas picadas.',
    price: 49.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-calabresa-req-10',
    name: 'Calabresa c/ Requeijão - 10 Unidades',
    description: 'Calabresa moída com requeijão cremoso.',
    price: 12.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-calabresa-req-25',
    name: 'Calabresa c/ Requeijão - 25 Unidades',
    description: 'Calabresa moída com requeijão cremoso.',
    price: 27.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-calabresa-req-50',
    name: 'Calabresa c/ Requeijão - 50 Unidades',
    description: 'Calabresa moída com requeijão cremoso.',
    price: 49.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-churros-10',
    name: 'Churros de Doce de Leite - 10 Unidades',
    description: 'Irresistível minichurros doce recheados com doce de leite.',
    price: 12.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-churros-25',
    name: 'Churros de Doce de Leite - 25 Unidades',
    description: 'Irresistível minichurros doce recheados com doce de leite.',
    price: 27.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-churros-50',
    name: 'Churros de Doce de Leite - 50 Unidades',
    description: 'Irresistível minichurros doce recheados com doce de leite.',
    price: 49.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-feijoada-10',
    name: 'Feijoada - 10 Unidades',
    description: 'Salgadinho artesanal frito de saborosa feijoada.',
    price: 14.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-feijoada-25',
    name: 'Feijoada - 25 Unidades',
    description: 'Salgadinho artesanal frito de saborosa feijoada.',
    price: 32.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-feijoada-50',
    name: 'Feijoada - 50 Unidades',
    description: 'Salgadinho artesanal frito de saborosa feijoada.',
    price: 59.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-medalhao-10',
    name: 'Medalhão 4 Queijos - 10 Unidades',
    description: 'Delicioso e recheado com blend especial de 4 queijos.',
    price: 13.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-medalhao-25',
    name: 'Medalhão 4 Queijos - 25 Unidades',
    description: 'Delicioso e recheado com blend especial de 4 queijos.',
    price: 31.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-medalhao-50',
    name: 'Medalhão 4 Queijos - 50 Unidades',
    description: 'Delicioso e recheado com blend especial de 4 queijos.',
    price: 57.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-carne-10',
    name: 'Aipim c/ Carne Moída - 10 Unidades',
    description: 'Massa de aipim saborosa com recheio de carne moída refogada.',
    price: 12.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-carne-25',
    name: 'Aipim c/ Carne Moída - 25 Unidades',
    description: 'Massa de aipim saborosa com recheio de carne moída refogada.',
    price: 29.00,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-carne-50',
    name: 'Aipim c/ Carne Moída - 50 Unidades',
    description: 'Massa de aipim saborosa com recheio de carne moída refogada.',
    price: 49.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-req-10',
    name: 'Aipim c/ Requeijão - 10 Unidades',
    description: 'Recheio cremoso e suave de requeijão com ótima massa de aipim.',
    price: 12.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-req-25',
    name: 'Aipim c/ Requeijão - 25 Unidades',
    description: 'Recheio cremoso e suave de requeijão with ótima massa de aipim.',
    price: 29.00,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-aipim-req-50',
    name: 'Aipim c/ Requeijão - 50 Unidades',
    description: 'Recheio cremoso e suave de requeijão com ótima massa de aipim.',
    price: 49.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-quibe-catupiry-10',
    name: 'Quibe c/ Catupiry - 10 Unidades',
    description: 'Delicioso quibe crocante com catupiry.',
    price: 13.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-quibe-catupiry-25',
    name: 'Quibe c/ Catupiry - 25 Unidades',
    description: 'Delicioso quibe crocante com catupiry.',
    price: 31.50,
    category: 'SALGADINHOS (20G)',
    available: true
  },
  {
    id: 'salg-quibe-catupiry-50',
    name: 'Quibe c/ Catupiry - 50 Unidades',
    description: 'Delicioso quibe crocante com catupiry.',
    price: 53.90,
    category: 'SALGADINHOS (20G)',
    available: true
  },

  // --- CATEGORY: CALABRESA ---
  {
    id: 'past-cal-mussarela',
    name: 'Cal. c/ Mussarela',
    description: 'Calabresa c/ mussarela',
    price: 12.40,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'past-cal-cheedar',
    name: 'Cal. c/ Cheedar',
    description: 'Calabresa c/ Cheddar',
    price: 12.90,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'past-cal-requeijao',
    name: 'Cal. c/ Requeijão',
    description: 'Calabresa c/ Requeijão',
    price: 12.90,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'past-cal-carne-alho',
    name: 'Cal. c/ Carne e Alho',
    description: 'Calabresa, Carne e Alho',
    price: 13.90,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'past-cal-frango',
    name: 'Cal. c/ Frango',
    description: 'Calabresa e Frango',
    price: 12.80,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'past-cal-peru-minas',
    name: 'Cal. Peru e Minas',
    description: 'Calabresa, peito de peru e minas',
    price: 13.50,
    category: 'CALABRESA',
    available: true
  },

  // --- CATEGORY: CAMARÃO ---
  {
    id: 'past-cam-mussarela',
    name: 'Cam. c/ Mussarela',
    description: 'Camarão c/ Mussarela',
    price: 17.90,
    category: 'CAMARÃO',
    available: true
  },
  {
    id: 'past-cam-cheedar',
    name: 'Cam c/ Cheedar',
    description: 'Camarão c/ Cheddar',
    price: 18.90,
    category: 'CAMARÃO',
    available: true
  },
  {
    id: 'past-misto-camarao',
    name: 'Misto de Camarão',
    description: 'Camarão+Mussarela+Calabresa',
    price: 19.90,
    category: 'CAMARÃO',
    available: true
  },
  {
    id: 'past-cam-requeijao',
    name: 'Cam. c/ Requeijão',
    description: 'Camarão c/ Requeijão',
    price: 17.90,
    category: 'CAMARÃO',
    available: true
  },
  {
    id: 'past-xtudo-camarao',
    name: 'X-tudo de Camarão',
    description: 'Camarão+Bacon+Mussarela+BJack+Alho+Calabresa',
    price: 23.90,
    category: 'CAMARÃO',
    available: true
  },

  // --- CATEGORY: CARNE SECA ---
  {
    id: 'past-misto-c-seca',
    name: 'Misto de C. Seca',
    description: 'Carne S+Calabresa+Mussarela',
    price: 19.90,
    category: 'CARNE SECA',
    available: true
  },
  {
    id: 'past-c-seca-mussa',
    name: 'C. Seca c/ Mussa',
    description: 'Carne Seca c/ Mussarela',
    price: 17.90,
    category: 'CARNE SECA',
    available: true
  },
  {
    id: 'past-c-seca-cheedar',
    name: 'C. Seca c/ Cheedar',
    description: 'Carne Seca c/ Cheddar',
    price: 18.90,
    category: 'CARNE SECA',
    available: true
  },
  {
    id: 'past-c-seca-requeijao',
    name: 'C. Seca c/ Requeijão',
    description: 'Carne Seca c/ Requeijão',
    price: 17.90,
    category: 'CARNE SECA',
    available: true
  },
  {
    id: 'past-xtudo-c-seca',
    name: 'X-tudo de C. Seca',
    description: 'Carne Seca+Bacon+Mussarela+BJack+Alho+Calabresa',
    price: 23.90,
    category: 'CARNE SECA',
    available: true
  },

  // --- CATEGORY: AVENTURE-SE ---
  {
    id: 'past-queijo-alho',
    name: 'Queijo c/ Alho',
    description: 'Mussarela c/ Alho',
    price: 12.90,
    category: 'AVENTURE-SE',
    available: true
  },
  {
    id: 'past-carne-2-queijos',
    name: 'Carne c/ 2 Queijos',
    description: 'Carne c/ Mussarela e Cheddar',
    price: 14.50,
    category: 'AVENTURE-SE',
    available: true
  },
  {
    id: 'past-peru-2-queijos',
    name: 'Peru c/ 2 Queijos',
    description: 'Peru c/ Mussarela e Cheddar',
    price: 14.90,
    category: 'AVENTURE-SE',
    available: true
  },
  {
    id: 'past-frango-2-queijos',
    name: 'Frango c/ 2 Queijos',
    description: 'Frango c/ Mussarela e Cheddar',
    price: 13.90,
    category: 'AVENTURE-SE',
    available: true
  },
  {
    id: 'past-minas-requeijao',
    name: 'Minas c/ Requeijão',
    description: 'Queijo Minas c/ Requeijão',
    price: 12.90,
    category: 'AVENTURE-SE',
    available: true
  },

  // --- CATEGORY: NACIONALIDADES ---
  {
    id: 'past-arabe',
    name: 'Árabe',
    description: 'Carne moída, c. de azeitonas e alho',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'past-australiano',
    name: 'Australiano',
    description: 'Frango, bacon e requeijão',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'past-brasileiro',
    name: 'Brasileiro',
    description: 'Mussarela, bacon e alho frito',
    price: 11.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'past-italiano',
    name: 'Italiano',
    description: 'Carne c/ ervas finas e parmesão',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'past-mexicano',
    name: 'Mexicano',
    description: 'Carne, calabresa, salsa, mostarda e pimenta',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'past-americano',
    name: 'Americano',
    description: 'Carne+Calabresa+BillieJack+Alho',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'past-da-casa',
    name: 'Da casa',
    description: 'Carne+Molho Verde+Mussarela',
    price: 13.50,
    category: 'NACIONALIDADES',
    available: true
  },

  // --- CATEGORY: PEITO DE PERU ---
  {
    id: 'past-peru-mussarela',
    name: 'Peru c/ Mussarela',
    description: 'Peru c/ mussarela',
    price: 12.90,
    category: 'PEITO DE PERU',
    available: true
  },
  {
    id: 'past-peru-cheedar',
    name: 'Peru c/ Cheedar',
    description: 'Peru c/ Cheddar',
    price: 13.50,
    category: 'PEITO DE PERU',
    available: true
  },
  {
    id: 'past-misto-peru',
    name: 'Misto de Peru',
    description: 'Peru+Mussarela+Calabresa',
    price: 14.50,
    category: 'PEITO DE PERU',
    available: true
  },
  {
    id: 'past-peru-minas-oregano',
    name: 'Peru, Minas e Orégano',
    description: 'Peru, Minas e Orégano',
    price: 13.50,
    category: 'PEITO DE PERU',
    available: true
  },
  {
    id: 'past-peru-calab-cheedar',
    name: 'Peru, Calab. e Cheedar',
    description: 'Peru, Calabresa e Cheddar',
    price: 13.90,
    category: 'PEITO DE PERU',
    available: true
  },

  // --- CATEGORY: X-PASTEL ---
  {
    id: 'past-misto-carne',
    name: 'Misto de Carne',
    description: 'Carne+Calabresa+Mussarela',
    price: 13.90,
    category: 'X-PASTEL',
    available: true
  },
  {
    id: 'past-misto-frango',
    name: 'Misto de Frango',
    description: 'Frango+Calabresa+Mussarela',
    price: 13.50,
    category: 'X-PASTEL',
    available: true
  },
  {
    id: 'past-xtudo-carne',
    name: 'X-tudo de Carne',
    description: 'Carne+Calabresa+Mussarela+BJack e bacon',
    price: 15.90,
    category: 'X-PASTEL',
    available: true
  },
  {
    id: 'past-xtudo-frango',
    name: 'X-tudo de Frango',
    description: 'Frango+Calabresa+Mussarela+B.Jack e Bacon',
    price: 15.50,
    category: 'X-PASTEL',
    available: true
  },
  {
    id: 'past-xtudo-calabresa',
    name: 'X-tudo de Calabresa',
    description: 'Calabresa+Bacon+Mussarela+BJack+Alho',
    price: 15.90,
    category: 'X-PASTEL',
    available: true
  },

  // --- CATEGORY: PASTEL DOCE ---
  {
    id: 'past-chocolate-preto',
    name: 'Chocolate Preto',
    description: 'Chocolate preto de qualidade',
    price: 12.30,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'past-chocolate-caju',
    name: 'Chocolate c/ C. Caju',
    description: 'Chocolate preto com castanha',
    price: 12.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'past-chocolate-branco',
    name: 'Chocolate Branco',
    description: 'Chocolate branco de qualidade',
    price: 12.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'past-bis-chocolate',
    name: 'Bis c/ Chocolate',
    description: '2 Bis com chocolate preto extra',
    price: 12.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'past-minas-doceleite',
    name: 'Minas c/ D. de Leite',
    description: 'Queijo Minas c/ adição de doce de leite',
    price: 12.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'past-kitkat',
    name: 'Kitkat',
    description: 'Doce kitkat original',
    price: 14.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'past-prestigio',
    name: 'Prestígio',
    description: 'Beijinho c/ Chocolate Preto',
    price: 14.90,
    category: 'PASTEL DOCE',
    available: true
  },

  // --- CATEGORY: PASTÉIS TRADICIONAIS ---
  {
    id: 'past-carne',
    name: 'Carne',
    description: 'Carne moída de qualidade',
    price: 10.90,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'past-queijo-oregano',
    name: 'Queijo c/ Orégano',
    description: 'Mussarela tradicional c/ orégano',
    price: 10.19,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'past-pizza',
    name: 'Pizza',
    description: 'Mussarela, presunto e orégano',
    price: 12.15,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'past-frango',
    name: 'Frango',
    description: 'Frango defumado desfiado',
    price: 10.50,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'past-bacon',
    name: 'Bacon',
    description: 'Bacon com queijo especial e alho',
    price: 10.90,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'past-calabresa',
    name: 'Calabresa',
    description: 'Calabresa em cubos',
    price: 10.90,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'past-3queijos',
    name: '3 Queijos',
    description: 'Mussarela+Cheddar+Parmesão',
    price: 12.90,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },

  // --- CATEGORY: DUPLOS DE QUEIJO - 2X MAIS RECHEIO ---
  {
    id: 'past-duplo-queijo',
    name: 'Duplo Queijo',
    description: 'Queijo Mussarela',
    price: 12.90,
    category: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    available: true
  },
  {
    id: 'past-duplo-parmesao',
    name: 'Duplo Parmesão',
    description: 'Queijo mussarela e parmesão.',
    price: 13.50,
    category: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    available: true
  },
  {
    id: 'past-duplo-cheedar',
    name: 'Duplo Cheedar',
    description: 'Queijo mussarela + cheddar',
    price: 13.90,
    category: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    available: true
  },
  {
    id: 'past-duplo-requeijao',
    name: 'Duplo Requeijão',
    description: 'Queijo Mussarela + Requeijão',
    price: 13.90,
    category: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    available: true
  },

  // --- CATEGORY: TRADICIONAIS C/ QUEIJO ---
  {
    id: 'past-carne-queijo',
    name: 'Carne c/ Queijo',
    description: 'Carne moída c/ mussarela',
    price: 12.90,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'past-calabresa-queijo',
    name: 'Calabresa c/ Queijo',
    description: 'Calabresa c/ mussarela',
    price: 12.90,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'past-frangod-queijo',
    name: 'Frango D. c/ Queijo',
    description: 'Frango c/ mussarela',
    price: 12.50,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'past-mussarela-provolone',
    name: 'Mussarela c/ Provolone',
    description: 'Queijo mussarela e queijo provolone',
    price: 13.50,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'past-minas-oregano-trad',
    name: 'Minas c/ Orégano',
    description: 'Queijo Minas e orégano.',
    price: 10.90,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'past-romeu-julieta-trad',
    name: 'Romeu e Julieta',
    description: 'Queijo minas com goiabada',
    price: 11.55, // Wait, on image Romeu e Julieta was 11,50. Let's make it 11.50
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'past-romeu-julieta-trad-fix',
    name: 'Romeu e Julieta',
    description: 'Queijo minas com goiabada',
    price: 11.50,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },

  // --- CATEGORY: TRADICIONAIS C/ CHEEDAR ---
  {
    id: 'past-carne-cheedar',
    name: 'Carne c/ Cheedar',
    description: 'Carne moída com queijo cheddar',
    price: 12.90,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },
  {
    id: 'past-frango-cheedar',
    name: 'Frango c/ Cheedar',
    description: 'Frango com queijo cheddar',
    price: 13.50,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },
  {
    id: 'past-calabresa-cheedar',
    name: 'Calabresa c/ Cheedar',
    description: 'Linguiça calabresa c/ cheddar',
    price: 12.90,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },
  {
    id: 'past-4queijos',
    name: '4 Queijos',
    description: 'Mussarela+Cheddar+Parmesão+Provolone',
    price: 13.90,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },
  {
    id: 'past-5queijos',
    name: '5 Queijos',
    description: 'Mussarela+Cheddar+Parmesão+Provolone+Coalho',
    price: 14.90,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },

  // --- CATEGORY: COMBOS DISPONÍVEIS ---
  {
    id: 'combo-pastel-10',
    name: 'COMBO PASTEL DE $10',
    description: 'Queijo c/ Orégano, Carne Moída, Frango Defumado, Calabresa',
    price: 40.00,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-mussarela-carne',
    name: 'COMBO MUSSARELA C/ CARNE',
    description: '2 Mussarela c/ Orégano, 2 Carne c/ Mussarela + REFRI ANTÁRTICA 1L - GRÁTIS',
    price: 43.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-4queijos-calabresa',
    name: 'COMBO 4 QUEIJOS E CALABRESA',
    description: 'Mussarela c/ Orégano, Quatro Queijos, Carne c/ Mussarela + REFRI ANTÁRTICA 1L GRÁTIS, Carne c/ Calabresa',
    price: 49.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-sabores-exclusivos',
    name: 'COMBO SABORES EXCLUSIVOS',
    description: 'Mussarela c/ Orégano, Carne c/ Mussarela, Frango c/ Parmesão + REFRI ANTÁRTICA 1L GRÁTIS, Carne c/ Cheddar, Três Queijos',
    price: 54.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-5pasteis-gratis',
    name: 'COMBO 5 PASTÉIS + 1 PASTEL GRÁTIS',
    description: '2 Carne Moída, Frango Defumado, Mussarela c/ Orégano + 1 GRÁTIS MINAS C/ ORÉGANO, Calabresa',
    price: 54.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-peito-peru',
    name: 'COMBO PEITO DE PERU',
    description: 'Mussarela c/ Orégano, Carne c/ Mussarela, Peito de Peru c/ Mussarela + REFRI ANTÁRTICA 1L GRÁTIS, Peito de Peru c/ Cheddar',
    price: 49.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  }
].filter(p => !['salg-provolone-50', 'past-romeu-julieta-trad'].includes(p.id));

export const INITIAL_SETTINGS = {
  phone: '5521986483606', // (21) 98648-3606
  instagram: '@reidopastel.delivery',
  facebook: 'reidopasteloficial',
  address: 'Rua Ministro Lafaiete de Andrade, 1202 - Nova Iguaçu',
  deliveryFee: 5.00,
  isOpen: true,
  freeDistanceLimit: 3,
  pricePerExcessKm: 2.50,
  maxDeliveryDistance: 15,
  minDeliveryFee: 5.00,
  freeDeliveryMinOrderValue: 80,
  storeLatitude: -22.7529404,
  storeLongitude: -43.4833290,
  flyerUrl: ''
};
