import { Module } from '@nestjs/common';
import { CoffeesService } from './coffees.service.js';
import { CoffeesController } from './coffees.controller.js';
import { Coffee } from './entities/coffee.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flavor } from './entities/flavor.entity.js';

@Module({
    controllers: [CoffeesController],
    providers: [CoffeesService],
    exports: [],
    imports: [
      TypeOrmModule.forFeature([Coffee, Flavor])
    ],
})
export class CoffeesModule {}
