import { HttpResponse } from '@angular/common/http';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { RatingSpec } from '../shared/rating-spec.model';
import { Rating } from '../shared/rating.model';
import { RatingService } from '../shared/rating.service';
import { Vote } from '../shared/vote.model';
import { VoteService } from '../shared/vote.service';
import { XmEntity } from '../shared/xm-entity.model';
import { XmEntityService } from '../shared/xm-entity.service';
import { DEBUG_INFO_ENABLED } from '../../xm.constants';

declare let swal: any;

@Component({
    selector: 'xm-rating-list-section',
    templateUrl: './rating-list-section.component.html',
    styleUrls: ['./rating-list-section.component.scss']
})
export class RatingListSectionComponent implements OnInit, OnChanges {

    @Input() xmEntityId: number;
    @Input() ratingSpecs: RatingSpec[];

    xmEntity: XmEntity;
    ratings: Rating[] = [];
    votesNumber = {};

    constructor(private xmEntityService: XmEntityService,
                private ratingService: RatingService,
                private voteService: VoteService,
                private translateService: TranslateService) {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.xmEntityId && changes.xmEntityId.previousValue !== changes.xmEntityId.currentValue) {
            this.load();
        }
    }

    private load() {
        if (!this.ratingSpecs || !this.ratingSpecs.length) {
            if (DEBUG_INFO_ENABLED) {
                console.log('DBG: no spec no call');
            }
            return
        }
        this.xmEntityService.find(this.xmEntityId, {'embed': 'ratings'}).subscribe((xmEntity: XmEntity) => {
            this.xmEntity = xmEntity;
            if (xmEntity.ratings) {
                this.ratings = [...xmEntity.ratings];
            }

            for (const rating of this.ratings) {
                this.voteService.search({query: `rating.id:${rating.id}`}).subscribe(
                    (response) => {
                        this.votesNumber[rating.typeKey] = response.xTotalCount;
                    },
                    // TODO: error processing
                    (err) => console.log(err)
                );
            }
        });
    }

    getRatingByRatingSpec(ratingSpec: RatingSpec): Rating {
        const result = this.ratings ? this.ratings.filter((r) => r.typeKey === ratingSpec.key).shift() : null;
        if (!result) {
            return new Rating(undefined, ratingSpec.key, 0, new Date().toJSON(), undefined, undefined, this.xmEntity);
        }
        return Object.assign({}, result);
    }

    onChange(voteValue: number, rating: Rating) {
        const vote: Vote = new Vote(undefined, '', voteValue, '', new Date().toJSON(), undefined, this.xmEntity);
        rating.value = this.recalculateRating(voteValue, rating);
        if (!rating.id) {
            this.addRating(rating, vote);
        } else {
            this.updateRating(rating, vote);
        }
    }

    private recalculateRating(voteValue: number, rating: Rating): number {
        const votesNumber = this.votesNumber.hasOwnProperty(rating.typeKey) ? this.votesNumber[rating.typeKey] : 0;
        return (rating.value * votesNumber + voteValue) / (votesNumber + 1);
    }

    private addRating(rating: Rating, vote: Vote) {
        this.ratingService.create(rating).subscribe((response: Rating) => {
            vote.rating = response;
            this.addVote(vote);
        }, () => this.alert('success', 'xm-entity.rating-list-section.vote-error'));
    }

    private updateRating(rating: Rating, vote: Vote) {
        this.ratingService.update(rating).subscribe((response: Rating) => {
            vote.rating = response;
            this.addVote(vote);
        }, () => this.alert('success', 'xm-entity.rating-list-section.vote-error'));
    }

    private addVote(vote: Vote) {
        this.voteService.create(vote).subscribe(() => {
            this.load();
            this.alert('success', 'xm-entity.rating-list-section.vote-success');
        }, () => this.alert('error', 'xm-entity.rating-list-section.vote-error'));
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
