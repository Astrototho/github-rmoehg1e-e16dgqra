import { describe, expect, it } from 'vitest';
import {
  activityFormSchema,
  buildDefaultTitle,
  firstErrorMessage,
  formDataToObject,
  isValidUserId,
  isValidUuid,
  messageContentSchema,
  reportSchema,
} from '@/lib/validation';

const validForm = {
  type: 'trail',
  date: '2026-11-03',
  time: '08:30',
  location: 'Fontaine au Lion',
  latitude: '45.19',
  longitude: '5.72',
  distance: '25.5',
  elevation: '1200',
};

describe('identifiants', () => {
  it('accepte un ID athlète Strava', () => {
    expect(isValidUserId('107809552')).toBe(true);
  });

  it("rejette toute tentative d'injection dans les filtres", () => {
    expect(isValidUserId('0),id.not.is.null,and(sender_id.eq.0')).toBe(false);
    expect(isValidUserId('1322d167-b2e7-4940-91a4-3d1b1d108284')).toBe(false);
    expect(isValidUserId('')).toBe(false);
  });

  it('valide les UUID', () => {
    expect(isValidUuid('1322d167-b2e7-4940-91a4-3d1b1d108284')).toBe(true);
    expect(isValidUuid('not-a-uuid')).toBe(false);
  });
});

describe('activityFormSchema', () => {
  it('accepte un formulaire complet sans titre ni description', () => {
    const parsed = activityFormSchema.parse(validForm);
    expect(parsed).toMatchObject({
      type: 'trail',
      latitude: 45.19,
      distance: 25.5,
      elevation: 1200,
      title: null,
      description: null,
    });
  });

  it('exige le point GPS', () => {
    const { latitude: _lat, longitude: _lng, ...withoutCoords } = validForm;
    const result = activityFormSchema.safeParse(withoutCoords);
    expect(result.success).toBe(false);
    expect(firstErrorMessage(result.error!)).toBe('Place le point de départ sur la carte.');
  });

  it('refuse un sport retiré ou inconnu', () => {
    expect(activityFormSchema.safeParse({ ...validForm, type: 'velo' }).success).toBe(false);
  });

  it('refuse des valeurs hors limites', () => {
    expect(activityFormSchema.safeParse({ ...validForm, distance: '0' }).success).toBe(false);
    expect(activityFormSchema.safeParse({ ...validForm, elevation: '-5' }).success).toBe(false);
    expect(activityFormSchema.safeParse({ ...validForm, elevation: '12.5' }).success).toBe(false);
    expect(activityFormSchema.safeParse({ ...validForm, latitude: '95' }).success).toBe(false);
    expect(
      activityFormSchema.safeParse({ ...validForm, description: 'x'.repeat(2001) }).success
    ).toBe(false);
  });

  it('formDataToObject ignore les champs vides', () => {
    const fd = new FormData();
    fd.set('title', '   ');
    fd.set('distance', '');
    fd.set('type', 'vtt');
    expect(formDataToObject(fd)).toEqual({ type: 'vtt' });
  });
});

describe('buildDefaultTitle', () => {
  it('génère un titre lisible', () => {
    expect(buildDefaultTitle({ type: 'trail', distance: 25, location: 'Bastille' })).toBe(
      'Trail 25 km · Bastille'
    );
    expect(buildDefaultTitle({ type: 'velo-route', distance: 42.5, location: 'Vizille' })).toBe(
      'Vélo route 42,5 km · Vizille'
    );
  });
});

describe('messages et signalements', () => {
  it('refuse un message vide ou trop long', () => {
    expect(messageContentSchema.safeParse('   ').success).toBe(false);
    expect(messageContentSchema.safeParse('x'.repeat(2001)).success).toBe(false);
    expect(messageContentSchema.parse('  Salut !  ')).toBe('Salut !');
  });

  it('n’accepte que les motifs prévus', () => {
    expect(reportSchema.safeParse({ reportedId: '123', reason: 'Autre' }).success).toBe(true);
    expect(reportSchema.safeParse({ reportedId: '123', reason: 'Spam' }).success).toBe(false);
  });
});
