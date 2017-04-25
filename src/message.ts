import { Segment, Path, emptyPath, prefixPath } from './path'

export type ErrorMessage   = { level: 'error'   , text: string , path: Path }
export type WarningMessage = { level: 'warning' , text: string , path: Path }
export type Message        = ErrorMessage | WarningMessage
export type Messages       = Array<Message>

export const error = (text: string): Messages => {
  return [ { level: 'error', text, path: emptyPath } ]
}

export const warning = (text: string): Messages => {
  return [ { level: 'warning', text, path: emptyPath } ]
}

export const prefixMessage = (prefix: Segment | Path, msg: Message): Message => {
  // TODO: Not sure why we need the type hint below:
  return {
    level: msg.level,
    text:  msg.text,
    path:  prefixPath(prefix, msg.path)
  } as Message
}
