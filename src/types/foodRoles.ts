export type FoodFunctionalRole =
  | 'energetico_cereal'     // Arroz, aveia, milho, cuscuz, trigo, massas
  | 'energetico_raiz'       // Mandioca, aipim, batata, batata-doce, inhame, cará
  | 'proteico_vegetal'      // Feijão carioca, preto, fradinho, grão-de-bico, lentilha, soja, ervilha
  | 'proteico_animal'       // Carnes bovinas, aves, pescados, ovos caipiras
  | 'hortalica'             // Folhas, legumes, verduras refogadas ou assadas
  | 'fruta'                 // Frutas frescas da safra regional
  | 'lacteo'                // Leites, queijos, iogurtes naturais
  | 'oleaginosa'            // Castanhas, nozes, sementes
  | 'liquido_base';         // Café, chás, água mineral, caldos caseiros

export type GuideFoodGroup =
  | 'cereais'
  | 'feijoes'
  | 'raizes_tuberculos'
  | 'legumes_verduras'
  | 'frutas'
  | 'castanhas_nozes'
  | 'leite_queijos'
  | 'carnes_ovos'
  | 'agua';
