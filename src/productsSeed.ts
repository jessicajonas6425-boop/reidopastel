import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // NACIONALIDADES
  {
    id: 'nac-arabe',
    name: 'Árabe',
    description: 'Carne moída, c. de azeitonas e alho',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'nac-australiano',
    name: 'Australiano',
    description: 'Frango, bacon e requeijão',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'nac-brasileiro',
    name: 'Brasileiro',
    description: 'Mussarela, bacon e alho frito',
    price: 11.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'nac-italiano',
    name: 'Italiano',
    description: 'Carne c/ ervas finas e parmesão',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'nac-mexicano',
    name: 'Mexicano',
    description: 'Carne, calabresa, salsa, mostarda e pimenta',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'nac-americano',
    name: 'Americano',
    description: 'Carne + Calabresa + BillieJack + Alho',
    price: 13.90,
    category: 'NACIONALIDADES',
    available: true
  },
  {
    id: 'nac-da-casa',
    name: 'Da casa',
    description: 'Carne + Molho Verde + Mussarela',
    price: 13.50,
    category: 'NACIONALIDADES',
    available: true
  },

  // X - PASTEL
  {
    id: 'x-misto-carne',
    name: 'Misto de Carne',
    description: 'Carne + Calabresa + Mussarela',
    price: 13.90,
    category: 'X - PASTEL',
    available: true
  },
  {
    id: 'x-misto-frango',
    name: 'Misto de Frango',
    description: 'Frango + Calabresa + Mussarela',
    price: 13.50,
    category: 'X - PASTEL',
    available: true
  },
  {
    id: 'x-tudo-carne',
    name: 'X-tudo de Carne',
    description: 'Carne + Calabresa + Mussarela + B.Jack e bacon',
    price: 15.90,
    category: 'X - PASTEL',
    available: true
  },
  {
    id: 'x-tudo-frango',
    name: 'X-tudo de Frango',
    description: 'Frango + Calabresa + Mussarela + B.Jack e Bacon',
    price: 15.50,
    category: 'X - PASTEL',
    available: true
  },
  {
    id: 'x-tudo-calabresa',
    name: 'X-tudo de Calabresa',
    description: 'Calabresa + Bacon + Mussarela + B.Jack + Alho',
    price: 15.90,
    category: 'X - PASTEL',
    available: true
  },

  // PEITO DE PERU
  {
    id: 'peru-mussarela',
    name: 'Peru c/ Mussarela',
    description: 'Peito de peru com mussarela',
    price: 12.90,
    category: 'PEITO DE PERU',
    available: true
  },
  {
    id: 'peru-cheddar',
    name: 'Peru c/ Cheddar',
    description: 'Peito de peru com cheddar cremoso',
    price: 13.50,
    category: 'PEITO DE PERU',
    available: true
  },
  {
    id: 'peru-misto-peru',
    name: 'Misto de Peru',
    description: 'Peru + Mussarela + Calabresa',
    price: 14.50,
    category: 'PEITO DE PERU',
    available: true
  },
  {
    id: 'peru-minas-oregano',
    name: 'Peru, Minas e Orégano',
    description: 'Peito de peru com queijo minas e orégano',
    price: 13.50,
    category: 'PEITO DE PERU',
    available: true
  },
  {
    id: 'peru-calab-cheddar',
    name: 'Peru, Calab. e Cheddar',
    description: 'Peito de peru, calabresa e cheddar',
    price: 13.90,
    category: 'PEITO DE PERU',
    available: true
  },

  // PASTEL DOCE
  {
    id: 'doce-choco-preto',
    name: 'Chocolate Preto',
    description: 'Chocolate preto de qualidade',
    price: 12.30,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'doce-choco-caju',
    name: 'Chocolate c/ C. Caju',
    description: 'Chocolate preto com castanha',
    price: 12.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'doce-choco-branco',
    name: 'Chocolate Branco',
    description: 'Chocolate branco de qualidade',
    price: 12.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'doce-bis-choco',
    name: 'Bis c/ Chocolate',
    description: '2 Bis com chocolate preto extra',
    price: 12.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'doce-minas-doce-leite',
    name: 'Minas c/ D. de Leite',
    description: 'Queijo Minas c/ adição de doce de leite',
    price: 12.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'doce-kitkat',
    name: 'Kitkat',
    description: 'Doce kitkat original',
    price: 14.90,
    category: 'PASTEL DOCE',
    available: true
  },
  {
    id: 'doce-prestigio',
    name: 'Prestígio',
    description: 'Beijinho c/ Chocolate Preto',
    price: 14.90,
    category: 'PASTEL DOCE',
    available: true
  },

  // CALABRESA
  {
    id: 'cal-mussarela',
    name: 'Cal. c/ Mussarela',
    description: 'Calabresa com mussarela',
    price: 12.40,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'cal-cheddar',
    name: 'Cal. c/ Cheddar',
    description: 'Calabresa com cheddar',
    price: 12.90,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'cal-requeijao',
    name: 'Cal. c/ Requeijão',
    description: 'Calabresa com requeijão',
    price: 12.90,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'cal-carne-alho',
    name: 'Cal. c/ Carne e Alho',
    description: 'Calabresa com carne e alho',
    price: 13.90,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'cal-frango',
    name: 'Cal. c/ Frango',
    description: 'Calabresa com frango desfiado',
    price: 12.80,
    category: 'CALABRESA',
    available: true
  },
  {
    id: 'cal-peru-minas',
    name: 'Cal. Peru e Minas',
    description: 'Calabresa com peito de peru e queijo minas',
    price: 13.50,
    category: 'CALABRESA',
    available: true
  },

  // CAMARÃO
  {
    id: 'cam-mussarela',
    name: 'Cam. c/ Mussarela',
    description: 'Camarão com mussarela',
    price: 17.90,
    category: 'CAMARÃO',
    available: true
  },
  {
    id: 'cam-cheddar',
    name: 'Cam c/ Cheddar',
    description: 'Camarão com cheddar',
    price: 18.90,
    category: 'CAMARÃO',
    available: true
  },
  {
    id: 'cam-misto',
    name: 'Misto de Camarão',
    description: 'Camarão + Mussarela + Calabresa',
    price: 19.90,
    category: 'CAMARÃO',
    available: true
  },
  {
    id: 'cam-requeijao',
    name: 'Cam. c/ Requeijão',
    description: 'Camarão com requeijão',
    price: 17.90,
    category: 'CAMARÃO',
    available: true
  },
  {
    id: 'cam-xtudo',
    name: 'X-tudo de Camarão',
    description: 'Camarão + Bacon + Mussarela + B.Jack + Alho + Calabresa',
    price: 23.90,
    category: 'CAMARÃO',
    available: true
  },

  // CARNE SECA
  {
    id: 'seca-misto',
    name: 'Misto de C. Seca',
    description: 'Carne S + Calabresa + Mussarela',
    price: 19.90,
    category: 'CARNE SECA',
    available: true
  },
  {
    id: 'seca-mussarela',
    name: 'C. Seca c/ Mussa',
    description: 'Carne Seca com mussarela',
    price: 17.90,
    category: 'CARNE SECA',
    available: true
  },
  {
    id: 'seca-cheddar',
    name: 'C. Seca c/ Cheddar',
    description: 'Carne Seca com cheddar',
    price: 18.89, // Was 18,90 in prompt or 18,90. Let's make it 18.90 as in text
    category: 'CARNE SECA',
    available: true
  },
  {
    id: 'seca-requeijao',
    name: 'C. Seca c/ Requeijão',
    description: 'Carne Seca com requeijão',
    price: 17.90,
    category: 'CARNE SECA',
    available: true
  },
  {
    id: 'seca-xtudo',
    name: 'X-tudo de C. Seca',
    description: 'Carne Seca + Bacon + Mussarela + B.Jack + Alho + Calabresa',
    price: 23.90,
    category: 'CARNE SECA',
    available: true
  },

  // AVENTURE-SE
  {
    id: 'ave-queijo-alho',
    name: 'Queijo c/ Alho',
    description: 'Mussarela c/ Alho',
    price: 12.90,
    category: 'AVENTURE-SE',
    available: true
  },
  {
    id: 'ave-carne-2queijos',
    name: 'Carne c/ 2 Queijos',
    description: 'Carne c/ Mussarela e Cheddar',
    price: 14.50,
    category: 'AVENTURE-SE',
    available: true
  },
  {
    id: 'ave-peru-2queijos',
    name: 'Peru c/ 2 Queijos',
    description: 'Peru c/ Mussarela e Cheddar',
    price: 14.90,
    category: 'AVENTURE-SE',
    available: true
  },
  {
    id: 'ave-frango-2queijos',
    name: 'Frango c/ 2 Queijos',
    description: 'Frango c/ Mussarela e Cheddar',
    price: 13.90,
    category: 'AVENTURE-SE',
    available: true
  },
  {
    id: 'ave-minas-requeijao',
    name: 'Minas c/ Requeijão',
    description: 'Queijo Minas c/ Requeijão',
    price: 12.90,
    category: 'AVENTURE-SE',
    available: true
  },

  // PASTÉIS TRADICIONAIS
  {
    id: 'trad-carne',
    name: 'Carne',
    description: 'Carne moída de qualidade',
    price: 10.90,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'trad-queijo-oregano',
    name: 'Queijo c/ Orégano',
    description: 'Mussarela tradicional c/ orégano',
    price: 10.19,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'trad-pizza',
    name: 'Pizza',
    description: 'Mussarela, presunto e orégano',
    price: 12.15,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'trad-frango',
    name: 'Frango',
    description: 'Frango defumado desfiado',
    price: 10.50,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'trad-bacon',
    name: 'Bacon',
    description: 'Bacon com queijo especial e alho',
    price: 10.90,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'trad-calabresa',
    name: 'Calabresa',
    description: 'Calabresa em cubos',
    price: 10.90,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },
  {
    id: 'trad-3queijos',
    name: '3 Queijos',
    description: 'Mussarela + Cheddar + Parmesão',
    price: 12.90,
    category: 'PASTÉIS TRADICIONAIS',
    available: true
  },

  // DUPLOS DE QUEIJO - 2X MAIS RECHEIO
  {
    id: 'dup-queijo',
    name: 'Duplo Queijo',
    description: 'Queijo Mussarela',
    price: 12.90,
    category: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    available: true
  },
  {
    id: 'dup-parmesao',
    name: 'Duplo Parmesão',
    description: 'Queijo mussarela e parmesão',
    price: 13.50,
    category: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    available: true
  },
  {
    id: 'dup-cheddar',
    name: 'Duplo Cheddar',
    description: 'Queijo mussarela + cheddar',
    price: 13.90,
    category: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    available: true
  },
  {
    id: 'dup-requeijao',
    name: 'Duplo Requeijão',
    description: 'Queijo Mussarela + Requeijão',
    price: 13.90,
    category: 'DUPLOS DE QUEIJO - 2X MAIS RECHEIO',
    available: true
  },

  // TRADICIONAIS C/ QUEIJO
  {
    id: 'tq-carne',
    name: 'Carne c/ Queijo',
    description: 'Pastel tradicional de carne moída com queijo derretido',
    price: 12.90,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'tq-calabresa',
    name: 'Calabresa c/ Queijo',
    description: 'Pastel tradicional de calabresa em cubos com queijo derretido',
    price: 12.90,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'tq-frango',
    name: 'Frango D. c/ Queijo',
    description: 'Pastel tradicional de frango desfiado com queijo derretido',
    price: 12.50,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'tq-provolone',
    name: 'Mussarela c/ Provolone',
    description: 'Combinação deliciosa de queijo mussarela e provolone',
    price: 13.50,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'tq-minas-oregano',
    name: 'Minas c/ Orégano',
    description: 'Queijo minas com orégano',
    price: 10.90,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },
  {
    id: 'tq-romeu-julieta',
    name: 'Romeu e Julieta',
    description: 'Queijo minas com goiabada',
    price: 11.50,
    category: 'TRADICIONAIS C/ QUEIJO',
    available: true
  },

  // TRADICIONAIS C/ CHEEDAR
  {
    id: 'tc-carne',
    name: 'Carne c/ Cheddar',
    description: 'Pastel de carne com cheddar cremoso',
    price: 12.90,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },
  {
    id: 'tc-frango',
    name: 'Frango c/ Cheddar',
    description: 'Pastel de frango desfiado com cheddar cremoso',
    price: 13.50,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },
  {
    id: 'tc-calabresa',
    name: 'Calabresa c/ Cheddar',
    description: 'Pastel de calabresa em cubos com cheddar cremoso',
    price: 12.90,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },
  {
    id: 'tc-4queijos',
    name: '4 Queijos',
    description: 'Deliciosa mistura gourmet de 4 queijos',
    price: 13.90,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },
  {
    id: 'tc-5queijos',
    name: '5 Queijos',
    description: 'A melhor e mais recheada combinação de 5 queijos do Rei',
    price: 14.90,
    category: 'TRADICIONAIS C/ CHEEDAR',
    available: true
  },

  // COMBOS DISPONÍVEIS
  {
    id: 'combo-pastel-10',
    name: 'Combo Pastel de $10',
    description: 'Preço promocional imperdível',
    price: 45.00, // Average of 40 ~ 50
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-pague3-leve4',
    name: 'Combo Pague 3 Leve 4',
    description: 'Leve 4 pastéis maravilhosos pagando apenas 3',
    price: 36.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-gratis-doce',
    name: 'Combo Grátis 1 Doce',
    description: 'Compre o combo e leve um pastel doce delicioso grátis',
    price: 49.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-exclusivos',
    name: 'Combo Sabores Exclusivos',
    description: 'Uma seleção de sabores especiais elaborada pelo Rei',
    price: 52.40, // Average of 49.90 ~ 54.90
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-carne-seca',
    name: 'Combo Carne Seca',
    description: 'Combo especial de pastéis de carne seca nobre',
    price: 59.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-camarao',
    name: 'Combo Camarão',
    description: 'Combo dos reis: pastéis de camarão premium na promoção',
    price: 59.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-mussarela-carne',
    name: 'Combo Mussarela c/ Carne',
    description: 'Deliciosa combinação tradicional para a família',
    price: 43.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-4queijos-calabresa',
    name: 'Combo 4 Queijos e Calabresa',
    description: 'Ideal para compartilhar com quem você ama',
    price: 49.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-5-mais-1',
    name: 'Combo 5 Pastéis + 1 Grátis',
    description: 'Compre 5 pastéis tradicionais à sua escolha e ganhe o sexto!',
    price: 54.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  },
  {
    id: 'combo-peru',
    name: 'Combo Peito de Peru',
    description: 'Leve e nutritivo, perfeito em todos os detalhes',
    price: 49.90,
    category: 'COMBOS DISPONÍVEIS',
    available: true
  }
];

export const INITIAL_SETTINGS = {
  phone: '5511999999999',
  instagram: '@reidopastel.delivery',
  facebook: 'reidopasteloficial',
  address: 'Avenida Paulista, 1000 - Bela Vista, São Paulo - SP',
  deliveryFee: 5.00,
  isOpen: true,
  freeDistanceLimit: 3,
  pricePerExcessKm: 2.50,
  maxDeliveryDistance: 15,
  minDeliveryFee: 5.00,
  freeDeliveryMinOrderValue: 80,
  storeLatitude: -23.561506, // Avenida Paulista, 1000
  storeLongitude: -46.656139
};
