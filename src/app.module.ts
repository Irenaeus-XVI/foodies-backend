
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import configuration from './config/envs';
import { MobileAppModule } from './mobile/mobile-app.module';
import { dashboardAppModule } from './dashboard/dashboard.module';
import { VendorModule } from './vendor/vendor-app.module';
import { CartFactoryService } from './mobile/cart/factory/cart.factory';
import { PromotionModule } from './mobile/promotion/promotion.module';
import { AddressModule } from './mobile/address/address.module';
import { RestaurantModule } from './vendor/restaurant/restaurant.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    },
    ),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('onlineDatabase').url,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
    MailerModule.forRoot({
      transport: {
        service: process.env.EMAIL_SERVICE,
        auth: { 
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    }),
    dashboardAppModule,
    MobileAppModule,
    VendorModule,
    PromotionModule,
    AddressModule,
    RestaurantModule,
  ],

  providers: [

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
