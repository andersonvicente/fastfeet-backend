import Mail from '../../lib/Mail';

class NewDeliveryMail {
  get key() {
    return 'NewDeliveryMail';
  }

  async handle({ data }) {
    const { delivery } = data;

    await Mail.sendMail({
      to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}`,
      subject: 'Nova encomenda para retirada',
      template: 'newdelivery',
      context: {
        id: delivery.id,
        deliveryman: delivery.deliveryman.name,
        product: delivery.product,
        recipient: delivery.recipient.name,
        address_street: delivery.recipient.address_street,
        address_number: delivery.recipient.address_number,
        address_complement: delivery.recipient.address_complement,
        city: delivery.recipient.city,
        state: delivery.recipient.state,
        zip_code: delivery.recipient.zip_code,
      },
    });
  }
}

export default new NewDeliveryMail();
