import { Component, OnInit, TemplateRef, ViewChild, NgZone } from '@angular/core';
import {DisplayGrid, GridsterComponent, GridsterConfig, GridsterItem, GridType, CompactType, GridsterItemComponentInterface, GridsterComponentInterface} from 'angular-gridster2';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-extend-fn',
  templateUrl: './extend-fn.component.html',
  styleUrls: ['./extend-fn.component.css']
})
export class ExtendFnComponent implements OnInit {

  @ViewChild('dialogTpl', { static: false }) dialogTpl: TemplateRef<any>;

  options: GridsterConfig;
  dashboard: Array<GridsterItem> = [];
  emptyCellDropChannel: string = 'dragChannel';

  item = {
    defaultSubType: 'bar',
    message: 'test',
    subTypes: null
  }

  private _background: string;
  private _bgType: 'img' | 'color';

  static eventStart(item: GridsterItem, itemComponent: GridsterItemComponentInterface, event: MouseEvent) {
    // console.info('eventStart', item, itemComponent, event);
  }

  static overlapEvent(source: GridsterItem, target: GridsterItem, grid: GridsterComponent) {
    // console.log('overlap', source, target, grid);
  }

  constructor(private dialog: MatDialog, private zone: NgZone) {}

  ngOnInit() {
    this.options = {
      compactType: CompactType.None,
      minCols: 12,
      minRows: 12,
      maxCols: 12,
      maxRows: 12,
      defaultItemCols: 1,
      defaultItemRows: 1,
      minItemCols: 1,
      minItemRows: 1,
      gridType: GridType.Fit,
      displayGrid: DisplayGrid.None,
      useTransformPositioning: false,
      pushItems: false,
      disablePushOnDrag: false,
      disablePushOnResize: false,
      pushResizeItems: true,
      scrollToNewItems: true,
      disableScrollHorizontal: true,
      disableScrollVertical: true,
      swap: false,
      draggable: {
        delayStart: 0,
        enabled: true,
        // ignoreContentClass: 'gridster-item-content',
        // ignoreContent: true,
        dragHandleClass: 'drag-handler',
        stop: this.eventStop.bind(this),
        start: ExtendFnComponent.eventStart,
        dropOverItems: true,
        dropOverItemsCallback: ExtendFnComponent.overlapEvent,
        dropOverItemStack: true,
        dropOverItemSplit:false,
      },
      resizable: {
        enabled: true
      },
      enableEmptyCellDrop: true,
      emptyCellDropChannel: this.emptyCellDropChannel,
      emptyCellDropCallback: this.createItem.bind(this),
      itemInitCallback: this.itemInit.bind(this)
      
    };
  }
  
  /**
   * 拖拽结束，同步一下属性，这个操作可以写在组件内，如果考虑高自由度，则还是以现在的方法
   */
  eventStop(item: GridsterItem, itemComponent: GridsterItemComponentInterface, event: MouseEvent) {
    // console.info('eventStop', item, itemComponent, event);
    if (itemComponent.$item.left &&　itemComponent.$item.top)　{
      Object.assign(itemComponent, { left: itemComponent.$item.left - 10, top: itemComponent.$item.top - 10 });
    }
    Object.assign(item, { ...itemComponent.$item });
  }

  /**
   * 这个是item在完成加载时的回调，同样是同步一下属性，也可写在组件内
   */
  itemInit(item: GridsterItem, itemComponent: GridsterItemComponentInterface) {
    if (this.options.draggable && this.options.draggable.dropOverItemStack) {
      setTimeout(() => {
        Object.assign(item, { width: itemComponent.width, height: itemComponent.height});
        Object.assign(itemComponent.$item, { width: itemComponent.width, height: itemComponent.height});
      }, 0);
    }
  }

  stackChanged(isStack: boolean) {
    if (isStack) {
      if (this.options.api && this.options.api.optionsChanged && this.options.draggable) {
        this.options.draggable.dropOverItemSplit = false;
        this.options.compactType = CompactType.None;
        this.options.disableScrollHorizontal = true;
        this.options.disableScrollVertical = true;
        this.options.api.optionsChanged();
      }
    } else {
      if (this.options.api && this.options.api.optionsChanged) {
        this.options.compactType = CompactType.CompactUpAndLeft;
        this.options.disableScrollHorizontal = true;
        this.options.disableScrollVertical = true;
        this.options.api.optionsChanged();
      }
    }
  }

  splitChanged(isSplit: boolean) {
    if (isSplit) {
      if (this.options.api && this.options.api.optionsChanged && this.options.draggable) {
        this.options.draggable.dropOverItemStack = false;
        this.options.disableScrollVertical = true;
        this.options.disableScrollHorizontal = true;
        this.options.api.optionsChanged();
      }
    }
  }

  zIndexChanged(gridster: GridsterComponentInterface, gridsterItem: GridsterItemComponentInterface) {
    gridster.gridRenderer.updateItem(gridsterItem.el, gridsterItem.$item, gridsterItem.renderer);
  }

  changedOptions() {
    if (this.options.api && this.options.api.optionsChanged) {
      this.dashboard = [];
      this.options.api.optionsChanged();
    }
  }

  saveLocalStorage() {
    localStorage.setItem('dashboard', JSON.stringify(this.dashboard));
    this.dialog.open(this.dialogTpl)
  }

  close() {
    this.dialog.closeAll();
  }

  restoreLocalStorage(gridster: GridsterComponentInterface) {
    const items = localStorage.getItem('dashboard');
    if (items) {
      const temp = JSON.parse(items ? items : '');
      if (temp) {
        this.dashboard = temp;
        setTimeout(() => {
          gridster.updateGrid();
        }, 0);
      }
    }
  }

    /**
   * 创建一个图表
   */
  createItem(event: MouseEvent, item: GridsterItem) {
    if (this.options.draggable &&　this.options.draggable.dropOverItemStack)　{
      item.rows = 2;
      item.cols = 2;
    }
    item.minItemRows = this.options.minItemRows;
    item.minItemCols = this.options.minItemCols;
    this.dashboard.push(item);
  }


  get backgroundStyle() {
    if (this._bgType === 'color') {
      return { 'background-color': this._background };
    } else {
      return {
        'background-image': this._background,
        'background-size': 'cover',
        'background-repeat': 'no-repeat'
      };
    }
  }

  removeItem($event, item) {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboard.splice(this.dashboard.indexOf(item), 1);
  }

  addItem() {
    this.dashboard.push({x: 0, y: 0, cols: 1, rows: 1});
  }

}
