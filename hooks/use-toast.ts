// A simplified version of shadcn/ui's use-toast hook to be robust and simple.
import * as React from "react"

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

const TOAST_LIMIT = 5;
const TOAST_AUTOCLOSE_DELAY = 5000; // 5 seconds

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
}

type State = {
  toasts: ToasterToast[]
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "REMOVE_TOAST"; toastId?: string }


const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "REMOVE_TOAST":
        return {
            ...state,
            toasts: state.toasts.filter((t) => t.id !== action.toastId),
        }
    default:
      return state
  }
}


function toast(props: ToastProps) {
  const id = (Math.random() + 1).toString(36).substring(7);

  dispatch({
    type: "ADD_TOAST",
    toast: { ...props, id },
  });

  setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", toastId: id });
  }, TOAST_AUTOCLOSE_DELAY);

  return { id };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, []) // Correct dependency array ensures this runs only once on mount.

  return {
    ...state,
    toast,
  }
}

export { useToast, toast }