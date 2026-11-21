import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional } from 'class-validator';
import { INTERESTS, LOCATION_SCOPES, PERSONAS, type Interest, type LocationScope, type Persona } from '../preferences.options.js';

/** PUT /me/preferences — every value must be one of the fixed setup options. */
export class SavePreferencesDto {
  @IsArray()
  @ArrayMaxSize(PERSONAS.length)
  @IsIn(PERSONAS, { each: true })
  personas!: Persona[];

  @IsArray()
  @ArrayMaxSize(INTERESTS.length)
  @IsIn(INTERESTS, { each: true })
  interests!: Interest[];

  @IsOptional()
  @IsIn(LOCATION_SCOPES)
  location_scope?: LocationScope;

  @IsOptional()
  @IsBoolean()
  skipped?: boolean;
}
