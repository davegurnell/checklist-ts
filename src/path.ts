export type Segment = string | number
export type Path    = Array<Segment>

export const emptyPath: Path =
  []

export function prefixPath(prefix: Segment | Path, path: Path = []): Path {
  if(prefix instanceof Array) {
    return prefix.concat(path)
  } else {
    return [ prefix ].concat(path)
  }
}
