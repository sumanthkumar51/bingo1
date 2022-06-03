import * as React from 'react';
import styles from '../styles/CreateRoom.module.css';
import io from 'socket.io-client';
import { createCartela, bingo } from '../utils/bingo';
import { instructions } from '../utils/instructions'

let socket;
let room1;
let amount;
let balls = {
    riffledOrder: [],
    riffleds: []
};

export default function CreateRoom() {
    
    const [room, setRoom] = React.useState('');
    const [qtdBalls, setQtdBalls] = React.useState(99);
    const [path, setPath] = React.useState('create-room');
    const [players, setPlayers] = React.useState([]);
    const [sort, setSort] = React.useState([]);
    const [bingoWinner, setBingoWinner] = React.useState('');

    React.useEffect(() => { socketInitializer(); }, []);
    const socketInitializer = async () => {
        await fetch('/api/socket?option=connection');
        socket = io();

        socket.on('connect', () => {
            console.log('connected');
        });

        socket.on('update-players', (msg) => {
            setPlayers(old => {
                let cartela = createCartela(amount, old.filter(el => el.cartela));
                socket.emit('send-players', {room: room1, msg: [...old.filter(el => el.name), msg.name]}); 
                socket.emit('send-cartela', {to: msg.id, cartela: cartela});
                return [...old, {name: msg.name, id: msg.id, cartela: cartela}];
            }); 
            socket.emit('send-cartela', {to: msg.id})
        });

        socket.on("get-bingo", (msg) => {
            console.log("here2")
            setPath('bingo');
            setBingoWinner(msg)
        }); 
    };

    const createRoom = () => {
        socket.emit('join-room', room);
        room1 = room
        amount = qtdBalls;
        setPath('wait-room'); 
    };

    const startGame = () => {
        setPath('play-room');
        balls.riffledOrder = bingo(amount);
        socket.emit("send-start", room);
    };

    const riffle = () => {
        balls.riffleds.unshift(balls.riffledOrder.pop());
        console.log(balls);
        setSort((old) => [balls.riffleds[0], ...old]);
        socket.emit("send-riffleds", room, balls.riffleds);
    }


    switch(path){
        case 'create-room':
            return <div className={styles.main}>
                    <h1 className={styles.title}>Criar Sala</h1>
                    <label className={styles.label}>NOME DA SALA:</label>
                    <input className={styles.input} value={room} minLength="5" maxLength="5" onChange={(e) => setRoom(e.target.value)} name="room" type="text"></input>
                    <label className={styles.label}>QUANTIDADE DE BOLAS:</label>
                    <input className={styles.input} value={qtdBalls} onChange={(e) => setQtdBalls(e.target.value)} name="qtdBalls" min={20} max={99} type="number"></input>
                    <button className={styles.btn_enter} onClick={createRoom}>Entrar</button>
                </div>
            
        case 'wait-room':
            return <section className={styles.main_wait}>
                    <div className={styles.div_grid_3}>
                    <h1 className={styles.title_wait}>ID DA SALA: </h1>
                    <h1 className={styles.room}>{room}</h1>               
                    <p>Quantidade de bolas: {qtdBalls}</p>
                    <button className={styles.btn_start} onClick={startGame}>Iniciar</button>
 
                </div>
                <div className={styles.div_grid_3}>
                    <p>Aguardando jogadores...</p>
                    {players.map((el, i) => {
                        return <p key={i}>{el.name} entrou.</p>
                    })}
                </div>
                <div className={styles.div_grid_3}>
                    <h3>Intruções</h3>
                    { instructions }
                </div>
            </section>
            
        case 'play-room':
            return <>
                <p>gaming</p>
                {sort.map((el, i) => {
                    return <li key={i}>{el}</li>
                })}
                <button onClick={riffle}>sortear</button>
            </>
        case 'bingo':
            return <>
                <p>Bingo</p>
                <p> { bingoWinner } venceu!</p>
            </>
        default:
            return <>
                <p>default</p>
            </>
    }
} 