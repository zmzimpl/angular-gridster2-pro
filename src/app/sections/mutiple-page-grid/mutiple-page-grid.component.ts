import { Component, OnInit, ViewChild, TemplateRef, NgZone, ViewChildren, QueryList } from '@angular/core';
import { CompactType, GridsterConfig, GridsterItem, GridsterItemComponentInterface, GridsterComponent, GridType, DisplayGrid, GridsterComponentInterface } from 'angular-gridster2';
import { MatDialog } from '@angular/material/dialog';
import { WjTabPanel } from 'wijmo/wijmo.angular2.nav';

@Component({
  selector: 'app-mutiple-page-grid',
  templateUrl: './mutiple-page-grid.component.html',
  styleUrls: ['./mutiple-page-grid.component.css']
})
export class MutiplePageGridComponent implements OnInit {

  @ViewChild('dialogTpl', { static: false }) dialogTpl: TemplateRef<any>;

  @ViewChild('wjTabPanel', { static: false }) wjTabPanel: WjTabPanel;

  @ViewChildren('gridster') gridster: QueryList<GridsterComponent>;

  options: GridsterConfig;
  dashboard: Array<Array<GridsterItem>> = [];
  selectedIndex = 0;
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
        start: MutiplePageGridComponent.eventStart,
        dropOverItems: true,
        dropOverItemsCallback: MutiplePageGridComponent.overlapEvent,
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
    this.dashboard = [
      []
    ]
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

  zIndexChanged(gridster: GridsterComponentInterface, gridsterItem: GridsterItemComponentInterface) {
    gridster.gridRenderer.updateItem(gridsterItem.el, gridsterItem.$item, gridsterItem.renderer);
  }

  changedOptions() {
    if (this.options.api && this.options.api.optionsChanged) {
      this.dashboard = [[]];
      this.options.api.optionsChanged();
    }
  }

  /**
   * 保存到本地缓存中
   */
  saveLocalStorage() {
    localStorage.setItem('dashboard', JSON.stringify(this.dashboard));
    this.dialog.open(this.dialogTpl)
  }

  close() {
    this.dialog.closeAll();
  }

  /**
   * 从本地缓存中恢复
   * @param gridster 
   */
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
   * 创建一个新的gridster面板
   */
  createDashboard() {
    this.dashboard = [...this.dashboard, []];
    this.selectedIndex = this.dashboard.length - 1;
  }

  /**
   * 当tab变化时要重新获取容器的大小
   * @param selectedIndex 
   */
  tabIndexChanged(selectedIndex) {
    this.gridster.forEach((item, index) => {
      if (index === selectedIndex) {
        item.resize();
      }
    })
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
    this.dashboard[this.selectedIndex].push(item);
  }

  /**
   * 删除图表
   * @param $event 
   * @param item 
   */
  removeItem($event, item) {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboard[this.selectedIndex].splice(this.dashboard[this.selectedIndex].indexOf(item), 1);
  }

}
