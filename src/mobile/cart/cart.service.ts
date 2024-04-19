import {
    Injectable,
    Logger,
    NotFoundException
} from '@nestjs/common';
import { message } from 'src/common/constants/message.constant';
import { CartRepository } from 'src/models/cart/cart.repository';
import { Cart } from 'src/models/cart/cart.schema';
import { MealRepository } from 'src/models';
import { Types } from 'mongoose';

@Injectable()
export class CartService {
    constructor(
        private cartRepository: CartRepository,
        private mealRepository: MealRepository
    ) { }

    private readonly logger = new Logger(CartService.name);

    handleError(error: any) {
        this.logger.error(error);
        throw error;
    }

    async findMealById(id: Types.ObjectId) {
        const meal = await this.mealRepository.getOne({ _id: id });
        if (!meal) {
            throw new NotFoundException(message.meal.NotFound);
        }

        return meal;
    }

    async findCartByUserId(userId: Types.ObjectId) {
        return this.cartRepository.getOne({
            userId: userId,
            isDeleted: false
        });
    }

    calcCartTotalPrice(cart: Cart) {
        let totalPrice = 0;
        cart.cartItems.forEach(meal => {
            meal.totalPrice = meal.quantity * meal.price;
            totalPrice += meal.quantity * meal.price;
        });
        cart.cartTotalPrice = totalPrice;
        return cart
    }

    calcNoOfCartItems(cart: Cart) {
        cart.noOfCartItems = cart.cartItems.length;
        return cart;
    }

    async addMealToCart(cart: Cart) {
        try {
            const meal = await this.findMealById(cart.cartItems[0].meal);
            cart.cartItems[0].price = meal.price;


            if (meal.restaurant.toString() !== cart.restaurant.toString()) {
                throw new NotFoundException(message.cart.MealDoesNotBelongToRestaurant);
            }

            let cartExist = await this.findCartByUserId(cart.userId);

            if (!cartExist) {
                const cartCreated = await this.cartRepository.create({
                    userId: cart.userId,
                    cartItems: cart.cartItems,
                    restaurant: cart.restaurant
                });

                cartCreated.cartTotalPrice = this.calcCartTotalPrice(cartCreated).cartTotalPrice;
                cartCreated.noOfCartItems = this.calcNoOfCartItems(cartCreated).noOfCartItems;

                await this.cartRepository.update(
                    { _id: cartCreated._id },
                    cartCreated,
                    {
                        new: true,
                    });

                return await this.cartRepository.getOne({ _id: cartCreated._id }, {},
                    {
                        populate: [
                            {
                                path: 'cartItems.meal',
                            },
                            {
                                path: 'restaurant',
                                select: '-password -category'
                            }
                        ]
                    }
                );
            }

            const item = cartExist.cartItems.find(item => item.meal.toString() === cart.cartItems[0].meal.toString());

            if (item) {
                item.quantity += cart.cartItems[0].quantity || 1;
            } else {
                cartExist.cartItems.push({ ...cart.cartItems[0], quantity: cart.cartItems[0].quantity || 1 });
            }

            this.calcCartTotalPrice(cartExist);
            cartExist.restaurant = cart.restaurant;
            if (cartExist.discount) {
                cartExist.totalPriceAfterDiscount = cartExist.cartTotalPrice - (cartExist.cartTotalPrice * cartExist.discount) / 100;
            }

            const updatedCart = await this.cartRepository.update(
                { _id: cartExist._id },
                {
                    ...cartExist,
                    noOfCartItems: cartExist.cartItems.length
                },
                {
                    new: true,
                    populate: [
                        {
                            path: 'cartItems.meal',
                        },
                        {
                            path: 'restaurant',
                            select: '-password -category'
                        }
                    ]
                },
            );
            return updatedCart;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getCart(userId: Types.ObjectId) {
        try {
            const cart = await this.cartRepository.getOne({
                userId: userId,
                isDeleted: false
            }, {}, {
                populate: [
                    {
                        path: 'cartItems.meal',
                    },
                    {
                        path: 'restaurant',
                        select: '-password -category'
                    }
                ]
            });
            if (!cart) {
                throw new NotFoundException(message.cart.NotFound);
            }
            return cart;
        } catch (error) {
            this.handleError(error);
        }
    }

    async updateMealQuantity(MealId: string, userId: string, updateCartDTO: number) {
        try {
            const mealExist = await this.findMealById(new Types.ObjectId(MealId));

            if (!mealExist) {
                throw new NotFoundException(message.meal.NotFound);
            }

            let existCart = await this.cartRepository.getOne({ userId: userId })

            const item = existCart.cartItems.find(item => item.meal.toString() == MealId.toString());

            if (item) {
                item.quantity = updateCartDTO['quantity']
                item.totalPrice = item.quantity * item.price;
            }


            existCart.cartTotalPrice = this.calcCartTotalPrice(existCart).cartTotalPrice;

            if (existCart.discount) {
                existCart.totalPriceAfterDiscount = existCart.cartTotalPrice - (existCart.cartTotalPrice * existCart.discount) / 100 //NOTE - 100-(100*50)/100
            }


            const updatedCart = await this.cartRepository.update(
                { _id: existCart._id },
                existCart,
                {
                    new: true,
                    populate: [
                        {
                            path: 'cartItems.meal',
                        },
                        {
                            path: 'restaurant',
                            select: '-password -category'
                        }
                    ]
                },
            );

            return updatedCart
        } catch (error) {
            this.handleError(error);
        }
    }

    async removeMealFromCart(MealId: string, userId: Types.ObjectId) {
        try {
            let cartExist = await this.findCartByUserId(userId);

            if (!cartExist) {
                throw new NotFoundException(message.cart.NotFound);
            }

            const deleteMeal = await this.cartRepository.update(
                { _id: cartExist._id },
                { $pull: { cartItems: { _id: MealId } } },
                { new: true },
            );

            cartExist = await this.findCartByUserId(userId);

            if (!deleteMeal) {
                throw new NotFoundException(message.meal.NotFound);
            }

            cartExist.cartTotalPrice = this.calcCartTotalPrice(cartExist).cartTotalPrice

            if (cartExist.discount) {
                cartExist.totalPriceAfterDiscount = cartExist.cartTotalPrice - (cartExist.cartTotalPrice * cartExist.discount) / 100;
            }

            cartExist.noOfCartItems = this.calcNoOfCartItems(cartExist).noOfCartItems;
            const updatedCart = await this.cartRepository.update(
                { _id: cartExist._id },
                cartExist,
                {
                    new: true,
                    populate: [
                        {
                            path: 'cartItems.meal',
                        },
                        {
                            path: 'restaurant',
                            select: '-password -category'
                        }
                    ]
                },
            );


            if (deleteMeal.cartItems.length === 0) {
                await this.cartRepository.update({ _id: deleteMeal._id },
                    {
                        discount: 0,
                        restaurant: null,
                    },
                    { new: true });
            }
            return updatedCart;
        } catch (error) {
            this.handleError(error);
        }
    }

    async deleteCart(userId: Types.ObjectId) {
        try {
            const cartExist = await this.findCartByUserId(userId);

            if (!cartExist) {
                throw new NotFoundException(message.cart.NotFound);
            }

            const deleteCart = await this.cartRepository.delete(
                { _id: cartExist._id }
            );

            return deleteCart;
        } catch (error) {
            this.handleError(error);
        }
    }
}
