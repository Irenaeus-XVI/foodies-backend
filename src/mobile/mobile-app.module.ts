import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/common';
import { CategoryModule } from './category/category.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { FavoriteModule } from './favorite/favorite.module';
import { MenuModule } from './menu/menu.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    AuthModule,
    ClientModule,
    RestaurantModule,
    CategoryModule,
    FavoriteModule,
    MenuModule,
    CartModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ]
})
export class MobileAppModule { }
