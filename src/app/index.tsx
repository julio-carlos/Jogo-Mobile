import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Pokemon = {
  id: number;
  name: string;
  image: string;
};

type Card = {
  id: number;
  pokemon: Pokemon;
  revealed: boolean;
  matched: boolean;
};

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairs, setPairs] = useState(0);
  const [loading, setLoading] = useState(false);

  async function startGame(numberOfCards: number) {
    setLoading(true);

    const numberOfPairs = numberOfCards / 2;

    try {
      const randomIds: number[] = [];

      while (randomIds.length < numberOfPairs) {
        const randomId = Math.floor(Math.random() * 1025) + 1;

        if (!randomIds.includes(randomId)) {
          randomIds.push(randomId);
        }
      }

      const pokemonData = await Promise.all(
        randomIds.map(async (id) => {
          const response = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${id}`
          );

          const data = await response.json();

          return {
            id: data.id,
            name: data.name,
            image:
              data.sprites.other['official-artwork'].front_default,
          };
        })
      );

      const newCards = pokemonData
        .flatMap((pokemon, index) => [
          {
            id: index * 2,
            pokemon,
            revealed: false,
            matched: false,
          },
          {
            id: index * 2 + 1,
            pokemon,
            revealed: false,
            matched: false,
          },
        ])
        .sort(() => Math.random() - 0.5);

      setCards(newCards);
      setSelectedCards([]);
      setMoves(0);
      setPairs(0);
      setGameStarted(true);
    } catch (error) {
      console.log('Erro ao buscar Pokémon:', error);
    }

    setLoading(false);
  }

  function handleCardPress(cardId: number) {
    if (selectedCards.length === 2) {
      return;
    }

    const card = cards.find(
      (item) => item.id === cardId
    );

    if (!card || card.revealed || card.matched) {
      return;
    }

    const updatedCards = cards.map((item) =>
      item.id === cardId
        ? { ...item, revealed: true }
        : item
    );

    setCards(updatedCards);

    const newSelectedCards = [
      ...selectedCards,
      cardId,
    ];

    setSelectedCards(newSelectedCards);

    if (newSelectedCards.length === 2) {
      setMoves((current) => current + 1);

      const firstCard = updatedCards.find(
        (item) => item.id === newSelectedCards[0]
      );

      const secondCard = updatedCards.find(
        (item) => item.id === newSelectedCards[1]
      );

      if (
        firstCard &&
        secondCard &&
        firstCard.pokemon.id === secondCard.pokemon.id
      ) {
        const matchedCards = updatedCards.map(
          (item) =>
            item.id === firstCard.id ||
            item.id === secondCard.id
              ? { ...item, matched: true }
              : item
        );

        setCards(matchedCards);
        setPairs((current) => current + 1);
        setSelectedCards([]);
      } else {
        setTimeout(() => {
          setCards((currentCards) =>
            currentCards.map((item) =>
              item.id === newSelectedCards[0] ||
              item.id === newSelectedCards[1]
                ? { ...item, revealed: false }
                : item
            )
          );

          setSelectedCards([]);
        }, 1000);
      }
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Buscando Pokémon...
        </Text>
      </View>
    );
  }

  if (!gameStarted) {
    return (
      <View style={styles.container}>

        <Text style={styles.title}>
          POKÉMON
        </Text>

        <Text style={styles.subtitle}>
          Jogo da Memória
        </Text>

        <Text style={styles.question}>
          Escolha a quantidade de cartas:
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => startGame(6)}
        >
          <Text style={styles.buttonText}>
            6 CARTAS
          </Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => startGame(12)}
        >
          <Text style={styles.buttonText}>
            12 CARTAS
          </Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => startGame(20)}
        >
          <Text style={styles.buttonText}>
            20 CARTAS
          </Text>
        </Pressable>

      </View>
    );
  }

  const numberOfCards = cards.length;

  let cardWidth = 105;
  let cardHeight = 120;
  let imageSize = 85;

  if (numberOfCards === 12) {
    cardWidth = 90;
    cardHeight = 105;
    imageSize = 75;
  }

  if (numberOfCards === 20) {
    cardWidth = (screenWidth - 70) / 4;
    cardHeight = cardWidth * 1.15;
    imageSize = cardWidth * 0.75;
  }

  return (
    <View style={styles.gameContainer}>

      <Text style={styles.gameTitle}>
        JOGO DA MEMÓRIA
      </Text>

      <View style={styles.info}>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>
            JOGADAS
          </Text>

          <Text style={styles.infoValue}>
            {moves}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>
            PARES
          </Text>

          <Text style={styles.infoValue}>
            {pairs} / {cards.length / 2}
          </Text>
        </View>

      </View>

      <View style={styles.board}>

        {cards.map((card) => (

          <Pressable
            key={card.id}
            style={[
              styles.card,
              {
                width: cardWidth,
                height: cardHeight,
              },
              card.matched && styles.matchedCard,
            ]}
            onPress={() => handleCardPress(card.id)}
          >

            {card.revealed || card.matched ? (

              <Image
                source={{
                  uri: card.pokemon.image,
                }}
                style={{
                  width: imageSize,
                  height: imageSize,
                }}
                resizeMode="contain"
              />

            ) : (

              <Text style={styles.questionMark}>
                ?
              </Text>

            )}

          </Pressable>

        ))}

      </View>

      <Pressable
        style={styles.restartButton}
        onPress={() => setGameStarted(false)}
      >
        <Text style={styles.restartText}>
          VOLTAR
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  title: {
    fontSize: 40,
    fontWeight: 'bold',
  },

  subtitle: {
    fontSize: 25,
    marginBottom: 50,
  },

  question: {
    fontSize: 18,
    marginBottom: 25,
  },

  button: {
    width: 220,
    padding: 18,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#e63946',
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  loadingText: {
    marginTop: 20,
    fontSize: 18,
  },

  gameContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 50,
  },

  gameTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },

  info: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },

  infoBox: {
    alignItems: 'center',
    minWidth: 100,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    margin: 4,
    borderRadius: 12,
    backgroundColor: '#457b9d',
    justifyContent: 'center',
    alignItems: 'center',
  },

  matchedCard: {
    backgroundColor: '#2a9d8f',
  },

  questionMark: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
  },

  restartButton: {
    marginTop: 15,
    padding: 12,
    alignItems: 'center',
  },

  restartText: {
    fontSize: 17,
    fontWeight: 'bold',
  },

});
