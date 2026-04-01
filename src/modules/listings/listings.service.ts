import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';

interface ListingImage {
  url: string;
  public_id: string;
}

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async create(hostId: string, dto: CreateListingDto, files: any[]) {
    const images: ListingImage[] = [];

    for (const file of files) {
      const result = await this.filesService.uploadImageToCloudinary(file);
      images.push({ url: result.url, public_id: result.public_id });
    }

    const listing = await this.prisma.listing.create({
      data: {
        hostId,
        title: dto.title,
        description: dto.description,
        city: dto.city,
        country: dto.country,
        maxGuests: dto.maxGuests,
        pricePerNight: dto.pricePerNight,
        images: images as any[],
      },
    });

    return listing;
  }

  async findAll(dto: SearchListingDto) {
    const {
      city,
      country,
      guests,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = dto;

    const where: any = { isActive: true };

    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (guests) where.maxGuests = { gte: guests };
    if (minPrice !== undefined)
      where.pricePerNight = { ...where.pricePerNight, gte: minPrice };
    if (maxPrice !== undefined)
      where.pricePerNight = { ...where.pricePerNight, lte: maxPrice };

    const [listings, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          city: true,
          country: true,
          maxGuests: true,
          pricePerNight: true,
          images: true,
          host: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    return listing;
  }

  async findByHost(hostId: string) {
    return this.prisma.listing.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, hostId: string, dto: UpdateListingDto) {
    await this.checkOwnership(id, hostId);

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country && { country: dto.country }),
        ...(dto.maxGuests && { maxGuests: dto.maxGuests }),
        ...(dto.pricePerNight && { pricePerNight: dto.pricePerNight }),
      },
    });
  }

  async addImages(id: string, hostId: string, files: any[]) {
    if (!files.length) throw new BadRequestException('No files provided');

    const listing = await this.checkOwnership(id, hostId);
    const currentImages = (listing.images as unknown as ListingImage[]) ?? [];

    const newImages: ListingImage[] = [];
    for (const file of files) {
      const result = await this.filesService.uploadImageToCloudinary(file);
      newImages.push({ url: result.url, public_id: result.public_id });
    }

    return this.prisma.listing.update({
      where: { id },
      data: { images: [...currentImages, ...newImages] as any[] },
    });
  }

  async deleteImage(id: string, hostId: string, publicId: string) {
    const listing = await this.checkOwnership(id, hostId);
    const currentImages = (listing.images as unknown as ListingImage[]) ?? [];

    const imageExists = currentImages.some((img) => img.public_id === publicId);
    if (!imageExists)
      throw new NotFoundException('Image not found in this listing');

    await this.filesService.deleteImage(publicId);

    const updatedImages = currentImages.filter(
      (img) => img.public_id !== publicId,
    );

    return this.prisma.listing.update({
      where: { id },
      data: { images: updatedImages as any[] },
    });
  }

  async toggleActive(id: string, hostId: string) {
    const listing = await this.checkOwnership(id, hostId);

    return this.prisma.listing.update({
      where: { id },
      data: { isActive: !listing.isActive },
    });
  }

  async remove(id: string, hostId: string) {
    const listing = await this.checkOwnership(id, hostId);
    const images = (listing.images as unknown as ListingImage[]) ?? [];

    await Promise.all(
      images.map((img) => this.filesService.deleteImage(img.public_id)),
    );

    await this.prisma.listing.delete({ where: { id } });

    return { status: 200, message: 'Listing deleted successfully' };
  }

  // ── Helpers ──────────────────────────────────────────────────

  private async checkOwnership(id: string, hostId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.hostId !== hostId)
      throw new ForbiddenException('Access denied');

    return listing;
  }
}
