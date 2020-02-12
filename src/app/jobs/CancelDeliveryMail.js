import Mail from '../../lib/Mail';

class CancelDeliveryMail {
  get key() {
    return 'CancelDeliveryMail';
  }

  async handle({ data }) {
    const { deliveryProblem } = data;

    const { delivery } = deliveryProblem;

    await Mail.sendMail({
      to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}`,
      subject: 'Entrega cancelada',
      template: 'canceldelivery',
      context: {
        id: delivery.id,
        deliveryman: delivery.deliveryman.name,
        product: delivery.product,
        recipient: delivery.recipient.name,
        problem: deliveryProblem.description,
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

export default new CancelDeliveryMail();
