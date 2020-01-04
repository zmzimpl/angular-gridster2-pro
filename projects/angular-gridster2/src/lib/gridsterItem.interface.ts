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
  splitingItemComponent?: GridsterItemComponentInterface,

  left?: number;
  top?: number;
  zIndex?: number;
  width?: number;
  height?: number;

  [propName: string]: any;
}
/** 分裂模式 */
export enum GridsterItemSplitMode {
  up = 'up',
  down = 'down',
  left = 'left',
  right = 'right'
}