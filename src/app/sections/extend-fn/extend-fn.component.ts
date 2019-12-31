import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {DisplayGrid, GridsterComponent, GridsterConfig, GridsterItem, GridsterItemComponentInterface, GridType, CompactType} from 'angular-gridster2';
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

  constructor(private dialog: MatDialog) {}

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

    };
    this.dashboard = [
      {cols: 2, rows: 1, y: 0, x: 0, left: 100, top: 50},
      {cols: 2, rows: 2, y: 0, x: 2, left: 120, top: 60},
    ]
  }
  
  eventStop(item: GridsterItem, itemComponent: GridsterItemComponentInterface, event: MouseEvent) {
    // console.info('eventStop', item, itemComponent, event);
    console.log(item);
    Object.assign(item, { ...itemComponent.$item });
    console.log(this.dashboard);
  }

  stackChanged(isStack: boolean) {
    if (isStack) {
      if (this.options.api && this.options.api.optionsChanged) {
        this.options.compactType = CompactType.None;
        this.options.disableScrollHorizontal = false;
        this.options.disableScrollVertical = false;
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

  restoreLocalStorage() {
    const items = localStorage.getItem('dashboard');
    const temp = JSON.parse(items ? items : '');
    if (temp) {
      this.dashboard = temp;
    }
  }

    /**
   * 创建一个图表
   */
  createItem(event: MouseEvent, item: GridsterItem) {
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
