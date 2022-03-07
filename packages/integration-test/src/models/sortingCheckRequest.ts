export interface TableEnds {
  first: string;
  last: string;
}

export interface SortingCheckRequest {
  projects: TableEnds;
  packages: TableEnds;
  apis: TableEnds;
  sourceFiles: TableEnds;
}
