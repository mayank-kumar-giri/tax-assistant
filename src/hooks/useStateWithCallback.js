import { useState, useEffect, useRef } from 'react';

/**
 * Function that returns state and state setter that supports callback
 * @returns {Array}
 */
const useStateWithCallback = (initialState) => {
  const [state, setState] = useState(initialState);
  const callbackRef = useRef(() => null);

  const setStateAndCallback = (newState, callback = () => null) => {
    callbackRef.current = callback;
    setState(newState);
  };

  useEffect(() => {
    callbackRef.current(state);
    callbackRef.current = () => null;
  }, [state]);

  return [state, setStateAndCallback];
};

export default useStateWithCallback;
