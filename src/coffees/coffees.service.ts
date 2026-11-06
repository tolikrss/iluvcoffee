import { Injectable, HttpStatus, HttpException, NotFoundException } from '@nestjs/common';
import { Coffee } from './entities/coffee.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { CreateCoffeeDto } from './dto/create-coffee.dto.js';
import { UpdateCoffeeDto } from './dto/update-coffee.dto.js';
import { Flavor } from './entities/flavor.entity.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { DataSource } from 'typeorm';
import { Event } from '../events/entities/event.entity.js';
  
@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee) 
    private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(Flavor) 
    private readonly flavorRepository: Repository<Flavor>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery;

    return this.coffeeRepository.find({
      relations: { flavors: true },
      take: limit,
      skip: offset
    });
  }

  async findOne(id: string) {
    const coffee = await this.coffeeRepository.findOne({ where: { id: +id }, relations: { flavors: true } });

    if (!coffee) {
      throw new NotFoundException(`Coffee with ID ${id} not found`);
    }

    return coffee;
  }

  async create(createCoffeeDto: CreateCoffeeDto) {
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map(name => this.preloadFlavorByName(name))
    );

    const coffee = this.coffeeRepository.create({ 
      ...createCoffeeDto, 
      flavors, 
    });

    return this.coffeeRepository.save(coffee);
  }

  async update(id: string, updateCoffeeDto: UpdateCoffeeDto) {
    const flavors = updateCoffeeDto.flavors && (await Promise.all(
      updateCoffeeDto.flavors.map(name => this.preloadFlavorByName(name))
    ));

    const existingCoffee = await this.coffeeRepository.preload({ 
      id: +id, 
      ...updateCoffeeDto,
      flavors,
    });

    if (!existingCoffee) {
      throw new NotFoundException(`Coffee with ID ${id} not found`);
    }

    return this.coffeeRepository.save(existingCoffee);
  }

  async remove(id: string) {
    const coffee = await this.findOne(id);

    if (!coffee) {
      throw new NotFoundException(`Coffee with ID ${id} not found`);
    }

    return this.coffeeRepository.remove(coffee);
  }

  async recommendCoffee(coffee: Coffee) {
    const queryRunner = this.dataSource.createQueryRunner();  

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try { // TODO, explain that this is a transaction, and why we need it 
      coffee.recommendations++;

      const recommendEvent = new Event();
      recommendEvent.name = 'recommend_coffee';
      recommendEvent.type = 'coffee';
      recommendEvent.payload = { coffeeId: coffee.id };

      await queryRunner.manager.save(coffee);
      await queryRunner.manager.save(recommendEvent);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existingFlavor = await this.flavorRepository.findOne({ 
      where: { name } 
    });

    if (existingFlavor) {
      return existingFlavor;
    }

    return this.flavorRepository.create({ name });
  }
}
