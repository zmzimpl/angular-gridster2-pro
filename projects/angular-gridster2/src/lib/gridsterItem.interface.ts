import {GridsterItemComponentInterface} from './gridsterItemComponent.interface';

export interface GridsterItem {
  x: number;
  y: number;
  rows: number;
  cols: number;
  initCallback?: (item: GridsterItem, itemComponent: GridsterItemComponentInterface) => void;
  dragEnabled?: boolean;
  resizeEnabled?: boolean;
  compactEnabled?: boolean;
  maxItemRows?: number;
  minItemRows?: number;
  maxItemCols?: number;
  minItemCols?: number;
  minItemArea?: number;
  maxItemArea?: number;

  spliting?: GridsterItemSplitMode,
  /** 被切分的item */
  splitingItemComponent?: GridsterItemComponentInterface,

  /** 以下5个属性用于堆叠模式　*/
  left?: number;
  top?: number;
  zIndex?: number;
  width?: number;
  height?: number;

  [propName: string]: any;
}
/** 分裂模式（或者说分裂的位置） */
export enum GridsterItemSplitMode {
  up = 'up',
  down = 'down',
  left = 'left',
  right = 'right'
}