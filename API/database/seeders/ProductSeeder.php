<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Casos de teste embutidos no catálogo:
     *  - MCU-STM32-BLUEPILL: estoque zero (indisponível)
     *  - COM-ETH-W5100: inativo (soft delete) e com estoque maior que zero
     *  - MCU-PROMINI-5V, SEN-BMP280, COM-MICROSD: estoque baixo (5 ou menos)
     *  - SEN-LDR-5MM-10 e KIT-HOLDER-18650-2X: sem avaliação (rating nulo)
     */
    public function run(): void
    {
        $now = now();
        $categories = DB::table('categories')->pluck('id', 'name');

        foreach ($this->catalog() as $categoryName => $products) {
            foreach ($products as $row) {
                // Cada linha: [sku, nome, descrição, specs, preço, estoque, avaliação, inativo?]
                [$sku, $name, $about, $specs, $price, $stock, $rating, $inactive] = $row + [7 => false];

                DB::table('products')->insert([
                    'category_id' => $categories[$categoryName],
                    'sku' => $sku,
                    'name' => $name,
                    'about' => $about,
                    'specs' => json_encode($specs),
                    'price' => $price,
                    'stock' => $stock,
                    'rating' => $rating,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'deleted_at' => $inactive ? now()->subDays(10) : null,
                ]);
            }
        }
    }

    private function catalog(): array
    {
        return [
            CategorySeeder::MICROCONTROLLERS => [
                ['MCU-UNO-R3', 'Arduino Uno R3 (compatível)', 'Placa de desenvolvimento compatível com Arduino Uno R3, ideal para iniciantes em eletrônica e robótica.', ['microcontrolador' => 'ATmega328P', 'tensao' => '5V', 'pinos_digitais' => 14, 'pinos_analogicos' => 6], 89.90, 120, 4.7],
                ['MCU-NANO-V3', 'Arduino Nano V3 (compatível)', 'Versão compacta com CH340, ótima para protoboard e projetos embarcados pequenos.', ['microcontrolador' => 'ATmega328P', 'tensao' => '5V', 'conversor_usb' => 'CH340'], 64.50, 85, 4.5],
                ['MCU-MEGA-2560', 'Arduino Mega 2560 (compatível)', 'Muitos pinos de I/O e memória extra para robôs com vários sensores e atuadores.', ['microcontrolador' => 'ATmega2560', 'tensao' => '5V', 'pinos_digitais' => 54, 'pinos_analogicos' => 16], 149.90, 40, 4.8],
                ['MCU-ESP32-DEV', 'ESP32 DevKit V1', 'Módulo dual core com Wi-Fi e Bluetooth integrados, para projetos de IoT.', ['microcontrolador' => 'ESP32', 'tensao' => '3.3V', 'conectividade' => ['Wi-Fi', 'Bluetooth']], 59.90, 200, 4.9],
                ['MCU-ESP8266-NODEMCU', 'NodeMCU ESP8266 V3', 'Placa com Wi-Fi e conversor USB serial, programável pela Arduino IDE.', ['microcontrolador' => 'ESP8266', 'tensao' => '3.3V', 'conectividade' => ['Wi-Fi']], 39.90, 150, 4.4],
                ['MCU-RPI-PICO', 'Raspberry Pi Pico', 'Placa com microcontrolador RP2040, programável em MicroPython e C/C++.', ['microcontrolador' => 'RP2040', 'tensao' => '3.3V', 'flash' => '2MB'], 34.90, 60, 4.8],
                ['MCU-STM32-BLUEPILL', 'STM32 Blue Pill', 'Placa com ARM Cortex-M3 de 32 bits e 72 MHz, para projetos que exigem mais desempenho.', ['microcontrolador' => 'STM32F103C8T6', 'tensao' => '3.3V', 'clock' => '72MHz'], 42.00, 0, 4.2],
                ['MCU-PROMINI-5V', 'Arduino Pro Mini 5V 16MHz', 'Placa minúscula sem conector USB, indicada para projetos embarcados de baixo consumo.', ['microcontrolador' => 'ATmega328P', 'tensao' => '5V', 'clock' => '16MHz'], 29.90, 3, 4.1],
            ],

            CategorySeeder::SENSORS => [
                ['SEN-HCSR04', 'Sensor Ultrassônico HC-SR04', 'Mede distâncias de 2 cm a 400 cm, muito usado em robôs que desviam de obstáculos.', ['tensao' => '5V', 'alcance' => '2-400cm', 'interface' => 'Trigger/Echo'], 12.90, 300, 4.6],
                ['SEN-DHT22', 'Sensor de Temperatura e Umidade DHT22', 'Sensor digital com boa precisão para temperatura e umidade relativa.', ['tensao' => '3.3-5V', 'temperatura' => '-40 a 80°C', 'umidade' => '0-100%'], 34.90, 75, 4.5],
                ['SEN-DHT11', 'Sensor de Temperatura e Umidade DHT11', 'Opção econômica para medir temperatura e umidade em projetos simples.', ['tensao' => '3.3-5V', 'temperatura' => '0 a 50°C', 'umidade' => '20-90%'], 14.90, 180, 4.0],
                ['SEN-MPU6050', 'Módulo Acelerômetro e Giroscópio MPU-6050', 'Sensor inercial de 6 eixos com interface I2C, essencial em robôs de equilíbrio e drones.', ['tensao' => '3.3-5V', 'eixos' => 6, 'interface' => 'I2C'], 24.90, 90, 4.7],
                ['SEN-TCRT5000', 'Sensor Infravermelho Reflexivo TCRT5000', 'Detecta linhas e obstáculos, muito usado em robôs seguidores de linha.', ['tensao' => '3.3-5V', 'saida' => 'Analógica e digital', 'alcance' => '1-25mm'], 7.50, 250, 4.3],
                ['SEN-LDR-5MM-10', 'Kit 10 LDR 5mm', 'Resistores dependentes de luz para detectar a luminosidade do ambiente.', ['diametro' => '5mm', 'quantidade' => 10], 6.00, 400, null],
                ['SEN-PIR-HCSR501', 'Sensor de Presença PIR HC-SR501', 'Detecta movimento por infravermelho passivo, com ajuste de sensibilidade e tempo.', ['tensao' => '5-20V', 'alcance' => 'até 7m', 'angulo' => '120°'], 11.90, 110, 4.4],
                ['SEN-BMP280', 'Sensor de Pressão Barométrica BMP280', 'Mede pressão atmosférica e temperatura, útil para altímetros e estações meteorológicas.', ['tensao' => '1.8-3.6V', 'interface' => 'I2C/SPI', 'pressao' => '300-1100hPa'], 19.90, 2, 4.6],
            ],

            CategorySeeder::MOTORS => [
                ['MOT-SERVO-SG90', 'Micro Servo Motor SG90 9g', 'Servo leve para braços robóticos, garras e mecanismos de direção.', ['tensao' => '4.8-6V', 'torque' => '1.8kg.cm', 'angulo' => '180°'], 16.90, 220, 4.5],
                ['MOT-SERVO-MG996R', 'Servo Motor MG996R', 'Servo de engrenagens metálicas com alto torque para robôs e braços maiores.', ['tensao' => '4.8-7.2V', 'torque' => '11kg.cm', 'engrenagens' => 'Metal'], 54.90, 45, 4.6],
                ['MOT-DC-TT', 'Motor DC com Caixa de Redução TT', 'Motor amarelo com redução 1:48 para chassis de robôs móveis.', ['tensao' => '3-6V', 'reducao' => '1:48', 'rpm' => '~200'], 13.90, 160, 4.2],
                ['MOT-NEMA17', 'Motor de Passo NEMA 17', 'Motor de 200 passos por volta para impressoras 3D, CNC e plotters.', ['passos_por_volta' => 200, 'corrente' => '1.7A', 'torque' => '4.4kg.cm'], 89.00, 30, 4.8],
                ['DRV-L298N', 'Driver Ponte H L298N', 'Controla dois motores DC ou um motor de passo bipolar.', ['tensao_motor' => '5-35V', 'corrente' => '2A por canal', 'canais' => 2], 21.90, 140, 4.3],
                ['DRV-A4988', 'Driver de Motor de Passo A4988', 'Driver com microstepping de até 1/16 para motores de passo bipolares.', ['tensao_motor' => '8-35V', 'corrente' => '2A', 'microstepping' => '1/16'], 14.50, 95, 4.4],
                ['DRV-TB6612FNG', 'Driver de Motor TB6612FNG', 'Driver compacto para dois motores DC, mais eficiente que o L298N.', ['tensao_motor' => '4.5-13.5V', 'corrente' => '1.2A por canal', 'canais' => 2], 27.90, 50, 4.7],
            ],

            CategorySeeder::MODULES => [
                ['COM-HC05', 'Módulo Bluetooth HC-05', 'Módulo Bluetooth serial mestre/escravo para controlar projetos pelo celular.', ['tensao' => '3.6-6V', 'protocolo' => 'Bluetooth 2.0', 'interface' => 'UART'], 38.90, 70, 4.3],
                ['COM-NRF24L01', 'Módulo de Rádio nRF24L01+', 'Transceptor 2.4GHz de baixo custo para comunicação entre placas.', ['tensao' => '1.9-3.6V', 'frequencia' => '2.4GHz', 'interface' => 'SPI'], 18.90, 130, 4.1],
                ['COM-LORA-RA02', 'Módulo LoRa Ra-02 SX1278 433MHz', 'Comunicação de longo alcance e baixo consumo para IoT.', ['tensao' => '3.3V', 'frequencia' => '433MHz', 'alcance' => 'até 10km em campo aberto'], 69.90, 25, 4.5],
                ['COM-OLED-096', 'Display OLED 0.96" I2C', 'Display gráfico monocromático de 128x64 pixels.', ['resolucao' => '128x64', 'interface' => 'I2C', 'tensao' => '3.3-5V'], 32.90, 100, 4.7],
                ['COM-LCD1602-I2C', 'Display LCD 16x2 com Módulo I2C', 'Display de 16 colunas e 2 linhas com backlight e adaptador I2C.', ['colunas' => 16, 'linhas' => 2, 'interface' => 'I2C'], 29.90, 80, 4.4],
                ['COM-RTC-DS3231', 'Módulo RTC DS3231', 'Relógio de tempo real de alta precisão com bateria de backup.', ['tensao' => '3.3-5.5V', 'interface' => 'I2C', 'precisao' => '±2ppm'], 22.90, 65, 4.6],
                ['COM-MICROSD', 'Módulo Leitor de Cartão Micro SD', 'Leitura e gravação em cartão micro SD via SPI.', ['tensao' => '3.3-5V', 'interface' => 'SPI'], 9.90, 5, 4.0],
                // Produto inativo (soft delete), mas com estoque > 0
                ['COM-ETH-W5100', 'Shield Ethernet W5100 (descontinuado)', 'Shield de rede Ethernet para Arduino Uno e Mega. Produto descontinuado e retirado do catálogo.', ['chip' => 'W5100', 'interface' => 'SPI'], 74.90, 18, 3.9, true],
            ],

            CategorySeeder::PROTOTYPING => [
                ['KIT-PROTOBOARD-830', 'Protoboard 830 Pontos', 'Placa de ensaio sem solda para montagem de circuitos.', ['pontos' => 830, 'dimensoes' => '165x55mm'], 18.90, 200, 4.5],
                ['KIT-JUMPERS-120', 'Kit 120 Jumpers para Protoboard', 'Fios pré-formatados de vários comprimentos e cores.', ['quantidade' => 120], 14.90, 310, 4.6],
                ['KIT-RESISTORES-600', 'Kit 600 Resistores 1/4W', '30 valores diferentes, 20 peças de cada, com tolerância de 5%.', ['potencia' => '1/4W', 'tolerancia' => '5%', 'quantidade' => 600], 29.90, 90, 4.7],
                ['KIT-LED-5MM-100', 'Kit 100 LEDs 5mm Coloridos', 'LEDs difusos em cores variadas para sinalização e testes.', ['diametro' => '5mm', 'quantidade' => 100], 15.90, 150, 4.2],
                ['KIT-HOLDER-18650-2X', 'Suporte para 2 Baterias 18650', 'Suporte com fios para alimentar projetos com duas células 18650.', ['baterias' => 2, 'tipo' => '18650'], 8.90, 175, null],
                ['KIT-MULTIMETRO-DT830B', 'Multímetro Digital DT830B', 'Multímetro básico para medir tensão, corrente e resistência.', ['display' => 'LCD 3½ dígitos', 'funcoes' => ['Tensão', 'Corrente', 'Resistência']], 49.90, 20, 4.3],
                ['KIT-CHASSI-2WD', 'Kit Chassi Robô 2WD', 'Chassi em acrílico com 2 motores, rodas e roda boba para robôs móveis.', ['motores' => 2, 'tracao' => '2WD', 'material' => 'Acrílico'], 79.90, 35, 4.4],
            ],

            CategorySeeder::IOT => [
                ['SENS-UM-DHT11', 'Sensor de Umidade DHT-11', 'Sensor de Umidade com pinos pré-soldados.', ['dimensões' => '23mm x 12mm x 5mm', 'precisão' => '±5,0%']],
                ['SENS-US-HCSR04', 'Sensor de Distância HC-SR04', 'Sensor de distância ultrassônico', ['dimensões' => '45mm x 20mm x 15mm', 'distância máxima' => '400cm']]
            ],
        ];
    }
}
