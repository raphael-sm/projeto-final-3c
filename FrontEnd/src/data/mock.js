// Dados de exemplo. Substitua por chamadas à sua API (veja App.jsx).
export const mockHome = {
  hero: {
    highlight: "Tudo",
    title: "para o seu próximo projeto.",
    subtitle: "Controladores, Componentes e peças com 25% de desconto.",
    image: "", // URL da imagem de fundo
  },
  benefits: [
    { id: 1, icon: "tag", title: "10% OFF", subtitle: "no PIX" },
    { id: 2, icon: "card", title: "Até 12x sem juros", subtitle: "*parcela mínima R$20" },
    { id: 3, icon: "truck", title: "Envio Rápido", subtitle: "em até 48h" },
    { id: 4, icon: "refund", title: "Satisfação Total", subtitle: "Reembolso em até 7 dias" },
  ],
  categories: ["Controladores", "Componentes", "Motores", "Prototipagem", "IoT", "Ferramentas", "Sensores", "Kits"]
    .map((name, i) => ({ id: i + 1, name, image: "", href: `/categoria/${name.toLowerCase()}` })),
  featured: [
    ["Arduino UNO R3", 42.49, 49.99], ["Placa de Ensaio 400 Pontos", 9.99, 12.99],
    ["Kit 40 LEDs Difusos 4 Cores", 12.99, 15.99], ["Arduino Nano V3", 29.99, 34.9],
    ["Suporte Chaveado 2 Pilhas AA", 13.49, 14.99], ["Protoboard 830 Pontos", 17.9, 21.9],
  ].map(([name, price, fullPrice], i) => ({ id: i + 1, name, price, fullPrice, rating: 4.5, reviews: 5, image: "" })),
  newArrivals: [
    ["STM32 Nucleo-64", 213.5, 249.99], ["Joystick Shield", 17.99, 21.9],
    ["Display LCD 16×2 D10-001", 24.99, 29.9], ["Kit Iniciante - Arduino", 185.5, 219.9],
    ["Sensor Temp./Um. DHT11", 7.99, 9.49], ["Módulo Relé 5V", 11.9, 14.9],
  ].map(([name, price, fullPrice], i) => ({ id: i + 1, name, price, fullPrice, rating: 4.5, reviews: 5, image: "" })),
  footer: {
    address: ["Avenida Marechal Deodoro, 3838", "Centro - Ribeirão Preto, SP", "CEP 14714-530"],
    company: ["Logoipsum Eletrônicos", "CNPJ: 76.803.621/0001-75"],
    phone: "(11) 3397-4600",
    email: "contato@logoipsum.com",
    hours: "Seg a Sex - 8h às 17h",
    notice: "Esta é uma loja fictícia, sem nenhum intuito de vender algo e foi criada como projeto institucional sem fins lucrativos.",
  },
};
export const mockUser = { greeting: "Bem-Vindo(a)", action: "Entrar ou Cadastrar" };
export const mockCart = { total: 0 };

// Dados da página da loja. Troque por fetch("/api/loja") quando a API existir (veja App.jsx).
const CTRL = "controladores-e-drivers";
export const mockStore = {
  sortOptions: [
    { value: "", label: "Nenhuma Ordenação" },
    { value: "price-asc", label: "Menor preço" },
    { value: "price-desc", label: "Maior preço" },
    { value: "name", label: "Nome (A–Z)" },
    { value: "rating", label: "Melhor avaliação" },
  ],
  priceHint: { min: "50,00", max: "500,00" }, // apenas placeholders dos campos de preço
  categories: [
    ["Controladores e Drivers", CTRL], ["Componentes", "componentes"], ["Motores DC", "motores-dc"],
    ["Prototipagem", "prototipagem"], ["IoT", "iot"], ["Ferramentas", "ferramentas"],
    ["Impressão 3D", "impressao-3d"], ["Cabos", "cabos"], ["Kits", "kits"],
    ["Displays", "displays"], ["Robótica", "robotica"],
  ].map(([name, slug], i) => ({ id: i + 1, name, slug })),
  products: [
    ["Arduino UNO R3 SMD", 42.49, 49.99, "Arduino"],
    ["Raspberry Pi Pico", 59.99, 69.99, "Raspberry Pi"],
    ["Arduino Nano v3", 29.99, 34.9, "Arduino"],
    ["Arduino MEGA 2560 R3", 119.9, 139.99, "Arduino"],
    ["ESP32 Wifi+Bluetooth", 49.9, 59.99, "Espressif"],
    ["STM32 Nucleo-64", 213.5, 249.99, "STMicroelectronics"],
    ["STM32 Blackpill", 37.5, 44.99, "WeAct"],
    ["Driver Motor DC L298n", 16.99, 19.99, "Genérico"],
    ["Driver Motor de Passo A4988", 20.49, 23.99, "Genérico"],
    ["Driver de Servo Motor PCA9865", 33.5, 39.99, "Genérico"],
    ["ESC Xxd-30A", 25.49, 29.99, "Genérico"],
    ["Driver Brushless ZS-X11H V1", 75.9, 29.99, "Genérico"], // valores conforme o layout; confira o "à vista"
  ].map(([name, price, fullPrice, manufacturer], i) => ({
    id: i + 1, name, price, fullPrice, manufacturer, category: CTRL, href: `/produto/${i + 1}`,
    rating: 4.5, reviews: 5, image: "", // URL da foto do produto
  })),
};

// Produto de exemplo (mesmo formato de fromApiDetail em data/api.js). Usado se a API falhar.
export const mockProduct = {
  id: 1,
  sku: "AU-R3MD",
  name: "Arduino UNO R3 SMD",
  about:
    "O Arduino Uno SMD é uma versão econômica do mais conhecido Arduino Uno R3, onde apresenta exatamente a mesma pinagem, bem como performance de funcionamento já que também conta com o Microcontrolador Atmega328.\n" +
    "A diferença do SMD para o R3 deve se a tecnologia de encapsulamento do Chip Atmega328, no Arduino SMD a montagem é feita diretamente na superfície da Placa e ocupa uma área muito pequena, no Arduino UNO por sua vez, o encapsulamento é DIP, por meio de perfurações na placa.\n\n" +
    "O Uno R3 é o modelo vendido e usado atualmente. Possui excelente custo/benefício, pois apresenta ótima quantidade de portas disponíveis e grande compatibilidade com os Shields Arduino. Agora ficou fácil comprar o seu Uno R3, com excelente preço na Logoipsum e envio imediato para todo o Brasil!\n" +
    "Arduino é uma Plataforma open hardware e possui seu próprio Ambiente de desenvolvimento baseado na linguagem C, simplificando a programação para iniciantes.",
  specs: {
    microcontrolador: "ATmega328",
    tensao: "5V",
    tensao_entrada: "7-9V",
    pinos_digitais: "14 (6 podem ser usadas como PWM)",
    pinos_analogicos: 6,
    corrente_io: ["40 mA (pico/curta duração);", "20 mA (contínua)"],
    corrente_3v3: "50mA",
    memoria_flash: "32KB (0,5KB usado no bootloader)",
    sram: "2KB",
    eeprom: "1KB",
    clock: "16MHz",
  },
  price: 42.49,
  fullPrice: 49.99,
  stock: 48,
  rating: 4.5,
  reviews: 5,
  categoryId: 1,
  images: [{ id: 1, url: "", position: 0 }, { id: 2, url: "", position: 1 }], // URLs das fotos
};
