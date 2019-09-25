import { HttpResponse } from '@angular/common/http';
import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { JhiEventManager } from 'ng-jhipster';
import { Subscription } from 'rxjs';

import { TagSpec } from '../shared/tag-spec.model';
import { Tag } from '../shared/tag.model';
import { TagService } from '../shared/tag.service';
import { XmEntity } from '../shared/xm-entity.model';
import { XmEntityService } from '../shared/xm-entity.service';
import {DEBUG_INFO_ENABLED, XM_EVENT_LIST} from '../../xm.constants';

declare let swal: any;

@Component({
    selector: 'xm-tag-list-section',
    templateUrl: './tag-list-section.component.html',
    styleUrls: ['./tag-list-section.component.scss']
})
export class TagListSectionComponent implements OnInit, OnChanges, OnDestroy {

    private eventSubscriber: Subscription;

    @Input() xmEntityId: number;
    @Input() tagSpecs: TagSpec[];

    xmEntity: XmEntity;
    tags: Tag[];

    constructor(private eventManager: JhiEventManager,
                private tagService: TagService,
                private xmEntityService: XmEntityService,
                private translateService: TranslateService) {
    }

    ngOnInit() {
        this.eventSubscriber = this.eventManager.subscribe(XM_EVENT_LIST.XM_ENTITY_DETAIL_MODIFICATION, () => this.load());
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.xmEntityId && changes.xmEntityId.previousValue !== changes.xmEntityId.currentValue) {
            this.load();
        }
    }

    private load() {
        if (!this.tagSpecs || !this.tagSpecs.length) {
            if (DEBUG_INFO_ENABLED) {
                console.log('DBG: no spec no call');
            }
            return
        }
        this.xmEntityService.find(this.xmEntityId, { 'embed': 'tags' }).subscribe((xmEntity: XmEntity) => {
            this.xmEntity = xmEntity;
            if (xmEntity.tags) {
                this.tags = [...xmEntity.tags];
            }
        });
    }

    onAdd(xmTag: Tag) {
        const tag: Tag = new Tag(undefined, 'DEFAULT', xmTag.name.toUpperCase(), new Date().toJSON(), this.xmEntity);
        this.tagService.create(tag).subscribe(
            () => this.load(),
            () => {
                this.alert('error', 'xm-entity.tag-list-section.add-error');
                this.load();
            });
    }

    onRemove(xmTag: Tag) {
        this.tagService.delete(xmTag.id).subscribe(
            () => this.load(),
            () => {
                this.alert('error', 'xm-entity.tag-list-section.remove-error');
                this.load();
            });
    }

    private alert(type, key) {
        swal({
            type: type,
            text: this.translateService.instant(key),
            buttonsStyling: false,
            confirmButtonClass: 'btn btn-primary'
        });
    }

}
