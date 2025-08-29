export default async function (model: any, data: any, next: any) {
    if (data.isNew) {
        let total = await model.find().sort({ id: -1 }).limit(1);
        data.id = total.length === 0 ? 1 : Number(total[0].id) + 1;
        next();
    };
};