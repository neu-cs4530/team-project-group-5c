import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,

  useToast
  } from '@chakra-ui/react';
  import React,{useCallback, useEffect,useState } from 'react';
import MinigameArea, { MinigameAreaListener } from '../../classes/MinigameArea';
import useMaybeVideo from '../../hooks/useMaybeVideo';
import useMinigameAreas from '../../hooks/useMinigameAreas';
import useCoveyAppState from '../../hooks/useCoveyAppState';
  
  
type NewMinigameWaitingProps = {
  minigameArea: MinigameArea;
  myPlayerID: string;
  closeModal: ()=>void;
}

/** 
 * Minigame modal component that opens when a new user starts playing a minigame. 
 */
function NewMinigameWaiting({minigameArea, myPlayerID, closeModal} : NewMinigameWaitingProps) : JSX.Element {
  const [playersByID, setPlayersByID] = useState<string[]>(minigameArea.playersByID);
  const [bodyMessage, setBodyMessage] = useState<string>("");
  const [isStartButtonHidden, setIsStartButtonHidden] = useState<boolean>(true);
  const {apiClient, sessionToken, currentTownID} = useCoveyAppState();

  const toast = useToast()
  const video = useMaybeVideo()
  // Sets the listeners of the minigame area to perform the operations whenever they are called 
  // onPlayersChange will set the players list based on what is passed in
  // onMinigameAreaDestroyed will run the closeModal() operation which will remove them from the mini game area 
  useEffect(() => {
    const updateListener: MinigameAreaListener = {
      onPlayersChange: (newPlayers: string[]) => {
        setPlayersByID(newPlayers);
      },
      onMinigameAreaDestroyed: () => {
        closeModal();
      }
    };
    minigameArea.addListener(updateListener);
    return () => {
      minigameArea.removeListener(updateListener);
    };
  }, [setPlayersByID, minigameArea, closeModal]);

  useEffect(() => {
    if (playersByID.length === 1) {
      setBodyMessage("Waiting for second player to connect ...");
      setIsStartButtonHidden(true);
    }
    // The server minigame has already been created 
    else if (playersByID[0] === myPlayerID) { // Host
      setBodyMessage(`${playersByID[1]} has joined the lobby. You can now start the game.`);
      setIsStartButtonHidden(false);
    } 
    else { // Guest
      setBodyMessage(`Waiting for host ${playersByID[0]} to start ...`);
    }
  }, [myPlayerID, playersByID]);

  const createTicTacToe = useCallback(async () => {
    // if (topic) {
        const minigameToCreate = minigameArea;
        // conversationToCreate.topic = topic;
      try {
        await apiClient.createMinigameArea({
          sessionToken,
          coveyTownID: currentTownID,
          host: playersByID[0],
          minigameArea: minigameToCreate.toServerMinigameArea(),
        });
        toast({
          title: 'Minigame Created!',
          status: 'success',
        });
        video?.unPauseGame();
        closeModal();
      } catch (err) {
        toast({
          title: 'Unable to start minigame',
          description: err.toString(),
          status: 'error',
        });
      
    }
  }, [apiClient, minigameArea, closeModal, currentTownID, sessionToken, toast, video]);



  return (
    <><ModalHeader>Start a new game at: {minigameArea.label} </ModalHeader><ModalBody>{bodyMessage}</ModalBody><ModalCloseButton /><ModalFooter>
      <Button onClick={createTicTacToe} hidden={isStartButtonHidden}>Start Game</Button>
      <Button onClick={closeModal}>Cancel</Button>
    </ModalFooter></>
  );

}


  type NewMinigameModalProps = {
      isOpen: boolean;
      myPlayerID: string;
      closeModal: ()=>void;
      newMinigameLabel: string;
  }
  export default function NewMinigameModal( {isOpen, myPlayerID, closeModal, newMinigameLabel} : NewMinigameModalProps): JSX.Element {
    // Only the minigame label is passed into this modal for both the host and guest. After the host creates the minigame,
    // it is updated on the server, so the useMinigameAreas() hook will update the minigameAreas list here. Then, the label is 
    // used to actually find the area. 

    // You cannot just pass in the area here from the WorldMap as it needs to be created on the server first to avoid any discrepencies
    // between the server and frontend 
    const minigameAreas = useMinigameAreas();
    const newMinigame = minigameAreas.find(mg => mg.label === newMinigameLabel);

      const video = useMaybeVideo()
  
      if (newMinigame) {
        return (
          <Modal isOpen={isOpen} onClose={()=>{closeModal(); video?.unPauseGame()}} closeOnOverlayClick={false}>
            <ModalOverlay />
            <ModalContent>
              <NewMinigameWaiting minigameArea={newMinigame} myPlayerID={myPlayerID} closeModal={closeModal}/>
            </ModalContent>
          </Modal>
        );
      }
      return <></>
  }
  